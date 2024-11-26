import {
    Point,
    AttachmentPoint,
    Direction,
    ComponentAttachmentPointMap,
    AttachmentPointMap
} from "@/Types";

export function findCenterPoint<P extends Point>(points: P[]): P | null {
    if (points.length <= 0) {
        return null;
    }
    const centerPoint = { ...points[0], x: 0, y: 0 } as P;
    points.forEach((point) => {
        centerPoint.x += Math.round(point.x);
        centerPoint.y += Math.round(point.y);
    });
    centerPoint.x = centerPoint.x / points.length;
    centerPoint.y = centerPoint.y / points.length;
    return centerPoint;
}

export function findConcaveHull<P extends Point>(points: P[]): P[] {
    if (points.length < 3) return points;

    // Helper function to calculate distance between two points
    const distance = (p1: P, p2: P): number => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    // Find leftmost point to start
    let start = points.reduce((min, p) =>
        p.x < min.x || (p.x === min.x && p.y < min.y) ? p : min
    );

    const hull: P[] = [];
    let currentPoint = start;
    let nextPoint: P;

    do {
        hull.push(currentPoint);
        nextPoint = points[0];

        // Find next point with most counterclockwise angle
        for (let i = 1; i < points.length; i++) {
            if (points[i] === currentPoint) continue;

            const cross =
                (points[i].x - currentPoint.x) *
                    (nextPoint.y - currentPoint.y) -
                (points[i].y - currentPoint.y) * (nextPoint.x - currentPoint.x);

            // If point is more counterclockwise or same angle but closer
            if (
                nextPoint === currentPoint ||
                cross > 0 ||
                (cross === 0 &&
                    distance(currentPoint, points[i]) <
                        distance(currentPoint, nextPoint))
            ) {
                nextPoint = points[i];
            }
        }

        currentPoint = nextPoint;
    } while (currentPoint !== start);

    return hull;
}

function getHullSegment<P extends Point>(
    hull: P[],
    direction1: Direction,
    direction2: Direction
): P[] {
    if (hull.length < 3) return hull;

    // Helper function to get points between two indices (inclusive), handling wrap-around
    const getPointsBetween = (start: number, end: number, array: P[]): P[] => {
        if (array.length === 0) return [];
        if (start === end) return [array[start]];

        const normalizedStart =
            ((start % array.length) + array.length) % array.length;
        const normalizedEnd =
            ((end % array.length) + array.length) % array.length;

        if (normalizedStart <= normalizedEnd) {
            return array.slice(normalizedStart, normalizedEnd + 1);
        } else {
            return [
                ...array.slice(normalizedStart, array.length),
                ...array.slice(0, normalizedEnd + 1)
            ];
        }
    };

    // Helper function to find extreme point index
    const findExtremePointIndex = (
        direction: Direction,
        otherDirection: Direction,
        hull: P[]
    ): number => {
        const primaryComparators = {
            N: (p: P) => p.y, // min y
            S: (p: P) => -p.y, // max y
            E: (p: P) => -p.x, // max x
            W: (p: P) => p.x // min x
        };

        const secondaryComparators = {
            N: (p: P) => p.x, // min x
            S: (p: P) => p.x, // min x
            E: (p: P) => p.y, // min y
            W: (p: P) => p.y // min y
        };

        const getPrimary = primaryComparators[direction];
        const getSecondary = secondaryComparators[otherDirection];

        return hull.reduce((minIdx, point, idx) => {
            const currentPrimary = getPrimary(point);
            const minPrimary = getPrimary(hull[minIdx]);

            if (currentPrimary < minPrimary) return idx;
            if (currentPrimary > minPrimary) return minIdx;

            const currentSecondary = getSecondary(point);
            const minSecondary = getSecondary(hull[minIdx]);
            return currentSecondary < minSecondary ? idx : minIdx;
        }, 0);
    };

    // Helper function to determine if two directions are in clockwise order
    const isClockwise = (dir1: Direction, dir2: Direction): boolean => {
        const directionOrder: Direction[] = [
            Direction.W,
            Direction.N,
            Direction.E,
            Direction.S
        ];
        const idx1 = directionOrder.indexOf(dir1);
        const idx2 = directionOrder.indexOf(dir2);

        // If idx2 is less than idx1, we need to consider it as idx2 + 4
        // to maintain the circular nature of the directions
        const adjustedIdx2 = idx2 < idx1 ? idx2 + 4 : idx2;

        // If the difference is 1 or 2, it's clockwise
        const diff = adjustedIdx2 - idx1;
        return diff > 0 && diff <= 2;
    };

    // If directions are not in clockwise order, reverse the hull
    const workingHull = isClockwise(direction1, direction2)
        ? [...hull]
        : [...hull].reverse();

    // Find indices in the potentially reversed hull
    const startIdx = findExtremePointIndex(direction1, direction2, workingHull);
    const endIdx = findExtremePointIndex(direction2, direction1, workingHull);

    return getPointsBetween(startIdx, endIdx, workingHull);
}

interface DirectionMap {
    [key: string]: Direction[];
}

export function getNormalizeAttachmentPoints(
    componentPointsMap: ComponentAttachmentPointMap,
    attachmentPointsMap: AttachmentPointMap
): AttachmentPointMap {
    const directionMap: DirectionMap = {
        "attach-front-left": [Direction.W, Direction.S],
        "attach-front-right": [Direction.E, Direction.S],
        "attach-back-left": [Direction.N, Direction.W],
        "attach-back-right": [Direction.N, Direction.E]
    };
    Object.keys(componentPointsMap).forEach((point) => {
        if (point in directionMap) {
            const hull = findConcaveHull(componentPointsMap[point]);
            const segment = getHullSegment(
                hull,
                directionMap[point][0],
                directionMap[point][1]
            );
            const attachmentPoint: AttachmentPoint | null =
                findCenterPoint(segment);
            if (attachmentPoint) {
                attachmentPointsMap[point] = attachmentPoint;
            }
        }
    });
    // for top and bottom points, just get the center point
    attachmentPointsMap["attach-bottom"] =
        findCenterPoint(componentPointsMap["attach-bottom"]) ||
        componentPointsMap["attach-bottom"][0];
    attachmentPointsMap["attach-top"] =
        findCenterPoint(componentPointsMap["attach-top"]) ||
        componentPointsMap["attach-top"][0];
    // TODO: Create a grid for top points

    return attachmentPointsMap;
}
