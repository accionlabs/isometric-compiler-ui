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
    centerPoint.x = Math.round(centerPoint.x / points.length);
    centerPoint.y = Math.round(centerPoint.y / points.length);
    return centerPoint;
}

export function removeDuplicatePoints<P extends Point>(points: P[]): P[] {
    const uniquePoints: P[] = [];
    points.forEach((p) => {
        const duplicates = uniquePoints.filter((p1) => {
            return p.x === p1.x && p.y === p1.y;
        });
        if (duplicates.length <= 0) {
            uniquePoints.push(p);
        }
    });
    return uniquePoints;
}

export function findConcaveHull<P extends Point>(points: P[]): P[] {
    if (points.length < 3) return points;

    const uniquePoints = removeDuplicatePoints(points);

    // round off all point coordinates
    uniquePoints.forEach((p) => {
        p.x = Math.round(p.x);
        p.y = Math.round(p.y);
    });

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
            N: (p: P) => Math.round(p.y), // min y
            S: (p: P) => Math.round(-p.y), // max y
            E: (p: P) => Math.round(-p.x), // max x
            W: (p: P) => Math.round(p.x) // min x
        };

        const secondaryComparators = {
            N: (p: P) => Math.round(p.x), // min x
            S: (p: P) => Math.round(p.x), // min x
            E: (p: P) => Math.round(p.y), // min y
            W: (p: P) => Math.round(p.y) // min y
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

function getNextRowLabel(current: string): string {
    return String.fromCharCode(current.charCodeAt(0) + 1);
}

export function createGridPoints(
    points: AttachmentPoint[],
    direction1: Direction,
    direction2: Direction
): AttachmentPoint[] {
    if (points.length === 0) return [];
    if (points.length === 1) return points;

    const gridPoints: AttachmentPoint[] = [];
    let remainingPoints = [...points];
    let currentRow = "a";

    while (remainingPoints.length > 0) {
        // Get the concave hull for current set of points
        const hull = findConcaveHull(remainingPoints);

        // Get the segment based on directions
        const segment = getHullSegment(hull, direction1, direction2);

        if (segment.length === 0) break;

        // Create grid points for current row
        segment.forEach((point, index) => {
            const gridPoint: AttachmentPoint = {
                name: `${point.name}-${currentRow}${index + 1}`,
                x: point.x,
                y: point.y
            };
            gridPoints.push(gridPoint);
        });

        // Remove used points from remaining points
        remainingPoints = remainingPoints.filter(
            (point) =>
                !segment.some(
                    (segPoint) =>
                        segPoint.x === point.x && segPoint.y === point.y
                )
        );

        // Move to next row
        currentRow = getNextRowLabel(currentRow);

        // Safety check to prevent infinite loops
        if (currentRow > "z") break;
    }

    return gridPoints;
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
            console.log("points:", componentPointsMap[point]);
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
    return attachmentPointsMap;
}

export function calculateCentroid(polygon: Point[]): Point {
    if (polygon.length === 0) return { x: 0, y: 0 };

    let area = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0; i < polygon.length; i++) {
        const j = (i + 1) % polygon.length;
        const cross = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;

        area += cross;
        cx += (polygon[i].x + polygon[j].x) * cross;
        cy += (polygon[i].y + polygon[j].y) * cross;
    }

    area = area / 2;
    const factor = 1 / (6 * area);

    return {
        x: cx * factor,
        y: cy * factor
    };
}

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function calculateBoundingBox(points: Point[]): BoundingBox {
    // Initialize with first point
    const bbox = points.reduce(
        (box, p) => ({
            minX: Math.min(box.minX, p.x),
            minY: Math.min(box.minY, p.y),
            maxX: Math.max(box.maxX, p.x),
            maxY: Math.max(box.maxY, p.y)
        }),
        {
            minX: points[0]?.x ?? 0,
            minY: points[0]?.y ?? 0,
            maxX: points[0]?.x ?? 0,
            maxY: points[0]?.y ?? 0
        }
    );

    return {
        x: bbox.minX,
        y: bbox.minY,
        width: bbox.maxX - bbox.minX,
        height: bbox.maxY - bbox.minY
    };
}

export interface ShapeAnalysis {
    hull: Point[];
    centroid: Point;
    mainAxis: {
        angle: number; // Angle in radians
        direction: Point; // Unit vector
    };
    aspectRatio: number;
    area: number;
    boundingBox: BoundingBox;
}

export function analyzeShape(points: Point[]): ShapeAnalysis {
    if (points.length < 3) {
        throw new Error("Need at least 3 points for shape analysis");
    }

    // Get convex hull using existing function
    const hull = findConcaveHull(points);

    // Calculate centroid
    const centroid = calculateCentroid(hull);

    // Calculate covariance matrix for PCA
    const cov = {
        xx: 0,
        xy: 0,
        yy: 0
    };

    hull.forEach((p) => {
        const dx = p.x - centroid.x;
        const dy = p.y - centroid.y;
        cov.xx += dx * dx;
        cov.xy += dx * dy;
        cov.yy += dy * dy;
    });

    // Find principal axis through eigenvalue decomposition
    const angle = Math.atan2(2 * cov.xy, cov.xx - cov.yy) / 2;

    // Calculate bounding box
    const bbox = calculateBoundingBox(hull);

    // Calculate area using shoelace formula
    const area =
        hull.reduce((a, p, i) => {
            const j = (i + 1) % hull.length;
            return a + (p.x * hull[j].y - hull[j].x * p.y);
        }, 0) / 2;

    return {
        hull,
        centroid,
        mainAxis: {
            angle,
            direction: {
                x: Math.cos(angle),
                y: Math.sin(angle)
            }
        },
        aspectRatio: bbox.width / bbox.height,
        area: Math.abs(area),
        boundingBox: bbox
    };
}

// Add helper to check if a point is inside the hull
export function isPointInHull(point: Point, hull: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = hull.length - 1; i < hull.length; j = i++) {
        const xi = hull[i].x,
            yi = hull[i].y;
        const xj = hull[j].x,
            yj = hull[j].y;

        const intersect =
            yi > point.y !== yj > point.y &&
            point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
}

// offset a specified path by a specified distance with respect to a central point
export function offsetPath(
    points: Point[],
    center: Point,
    placementDistance: number
): Point[] {
    return points.map((point) => {
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return {
            x: point.x + (placementDistance * dx) / distance,
            y: point.y + (placementDistance * dy) / distance
        };
    });
}

// Functions to get a smoothed hull

function isCollinear(p1: Point, p2: Point, p3: Point): boolean {
    const area = (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y);
    return Math.abs(area) < 1e-10;
}

function distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: { x: number; y: number }): { x: number; y: number } {
    const mag = Math.sqrt(v.x * v.x + v.y * v.y);
    return mag < 1e-10 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag };
}

function calculateAngle(p1: Point, p2: Point, p3: Point): number {
    const vector1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const vector2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    if (mag1 < 1e-10 || mag2 < 1e-10) {
        return 180;
    }

    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const cosTheta = dotProduct / (mag1 * mag2);
    const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta));
    return (Math.acos(clampedCosTheta) * 180) / Math.PI;
}

function interpolatePoints(start: Point, end: Point, spacing: number): Point[] {
    const points: Point[] = [];
    const totalDistance = distance(start, end);
    
    if (totalDistance <= spacing) {
        return [];
    }

    const numSegments = Math.ceil(totalDistance / spacing);
    const actualSpacing = totalDistance / numSegments;

    for (let i = 1; i < numSegments; i++) {
        const t = i / numSegments;
        points.push({
            x: Math.round((start.x + (end.x - start.x) * t) * 1000) / 1000,
            y: Math.round((start.y + (end.y - start.y) * t) * 1000) / 1000
        });
    }

    return points;
}

function adjustAngle(p1: Point, p2: Point, p3: Point, targetAngleDegrees: number): Point {
    if (!p1 || !p2 || !p3) return p2;
    
    if (isCollinear(p1, p2, p3)) {
        return p2;
    }

    const currentAngle = calculateAngle(p1, p2, p3);
    
    if (currentAngle >= targetAngleDegrees) {
        return p2;
    }

    const v1 = normalize({ x: p1.x - p2.x, y: p1.y - p2.y });
    const v2 = normalize({ x: p3.x - p2.x, y: p3.y - p2.y });

    const bisector = normalize({
        x: v1.x + v2.x,
        y: v1.y + v2.y
    });

    if (bisector.x === 0 && bisector.y === 0) {
        return p2;
    }

    const angleToAdd = (targetAngleDegrees - currentAngle) / 2;
    const angleRad = (angleToAdd * Math.PI) / 180;
    
    const dist1 = distance(p1, p2);
    const dist2 = distance(p2, p3);
    const avgDistance = (dist1 + dist2) / 2;
    const moveDistance = avgDistance * Math.tan(angleRad);
    const maxMoveDistance = Math.min(dist1, dist2) / 2;
    const finalMoveDistance = Math.min(moveDistance, maxMoveDistance);

    return {
        x: p2.x + bisector.x * finalMoveDistance,
        y: p2.y + bisector.y * finalMoveDistance
    };
}

export interface SmoothHullOptions {
    maxDistance?: number;
    thresholdAngle?: number;
}

export function createSmoothHull(
    points: Point[],
    options: SmoothHullOptions = {}
): Point[] {
    const defaultOptions = {
        maxDistance: 100.0,
        thresholdAngle: 120
    };

    const finalOptions = { ...defaultOptions, ...options };

    if (points.length < 3) return points;

    const hullPoints = findConcaveHull(points);
    let result: Point[] = [hullPoints[0]];

    // First pass: ensure consistent spacing between points
    for (let i = 0; i < hullPoints.length; i++) {
        const current = hullPoints[i];
        const next = hullPoints[(i + 1) % hullPoints.length];
        
        // Add interpolated points
        const interpolated = interpolatePoints(current, next, finalOptions.maxDistance);
        result.push(...interpolated);
        
        // Add the next point if it's not the starting point
        if (i < hullPoints.length - 1) {
            result.push(next);
        }
    }

    // Second pass: adjust angles while maintaining spacing
    let smoothedResult: Point[] = [];
    for (let i = 0; i < result.length; i++) {
        const prev = result[(i - 1 + result.length) % result.length];
        const current = result[i];
        const next = result[(i + 1) % result.length];

        const adjustedPoint = adjustAngle(
            prev,
            current,
            next,
            finalOptions.thresholdAngle
        );
        
        if (adjustedPoint && 
            !isNaN(adjustedPoint.x) && 
            !isNaN(adjustedPoint.y) && 
            isFinite(adjustedPoint.x) && 
            isFinite(adjustedPoint.y)) {
            smoothedResult.push(adjustedPoint);
        } else {
            smoothedResult.push(current);
        }
    }

    // Final pass: ensure spacing is maintained after angle adjustments
    let finalResult: Point[] = [smoothedResult[0]];
    for (let i = 0; i < smoothedResult.length - 1; i++) {
        const current = smoothedResult[i];
        const next = smoothedResult[i + 1];
        
        const interpolated = interpolatePoints(current, next, finalOptions.maxDistance);
        finalResult.push(...interpolated);
        finalResult.push(next);
    }

    return finalResult;
}