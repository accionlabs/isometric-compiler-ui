// @/lib/layoutUtils.ts
import { ComponentBoundsMap } from "@/components/flow/SVGNode";
import { createSmoothHull, findConcaveHull, offsetPath } from "./pointUtils";

interface Point {
    x: number;
    y: number;
}

interface Rectangle {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface NodePosition {
    position: Point;
    alignment: "left" | "right";
}

interface ComponentPosition {
    componentId: string;
    angle: number;
    center: Point;
}

// Base configuration interface that all layout strategies can extend
interface BaseLayoutConfig {
    padding: number;
    minSpacing: number;
}

// Layout strategy interface
interface LayoutStrategy {
    calculateLayout(components: ComponentPosition[]): Map<string, NodePosition>;
}

// Abstract base class for layout managers
export abstract class BaseLayoutManager implements LayoutStrategy {
    protected svgCenter: Point;
    protected layoutBounds: Rectangle;
    protected config: BaseLayoutConfig;

    constructor(
        rootBounds: { x: number; y: number; width: number; height: number },
        svgCenter: Point,
        config: BaseLayoutConfig
    ) {
        this.svgCenter = svgCenter;
        this.config = config;
        this.layoutBounds = this.calculateLayoutBounds(rootBounds);
    }

    protected calculateLayoutBounds(rootBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): Rectangle {
        return {
            left: this.svgCenter.x - rootBounds.width / 2 - this.config.padding,
            right:
                this.svgCenter.x + rootBounds.width / 2 + this.config.padding,
            top: this.svgCenter.y - rootBounds.height / 2 - this.config.padding,
            bottom:
                this.svgCenter.y + rootBounds.height / 2 + this.config.padding
        };
    }

    protected calculateAngle(point: Point): number {
        return Math.atan2(
            point.y - this.svgCenter.y,
            point.x - this.svgCenter.x
        );
    }

    abstract getPoints(): Point[];

    abstract calculateLayout(
        components: ComponentPosition[]
    ): Map<string, NodePosition>;
}

// Existing rectangular layout manager refactored to use base class
export interface RectangularLayoutConfig extends BaseLayoutConfig {
    spacingAdjustFactor: number;
}

export class RectangularLayoutManager extends BaseLayoutManager {
    private spacingAdjustFactor: number;

    constructor(
        rootBounds: { x: number; y: number; width: number; height: number },
        svgCenter: Point,
        config: RectangularLayoutConfig
    ) {
        super(rootBounds, svgCenter, config);
        this.spacingAdjustFactor = config.spacingAdjustFactor;
    }

    private getSideFromAngle(
        angle: number
    ): "top" | "right" | "bottom" | "left" {
        const degrees = ((angle * 180) / Math.PI + 360) % 360;
        if (degrees >= 315 || degrees < 45) return "right";
        if (degrees >= 45 && degrees < 135) return "bottom";
        if (degrees >= 135 && degrees < 225) return "left";
        return "top";
    }

    private projectToRectangle(angle: number): Point {
        const side = this.getSideFromAngle(angle);
        console.log(" node side:", side);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        switch (side) {
            case "right":
                return {
                    x: this.layoutBounds.right,
                    y:
                        this.svgCenter.y +
                        ((this.layoutBounds.right - this.svgCenter.x) * sin) /
                            cos
                };
            case "left":
                return {
                    x: this.layoutBounds.left,
                    y:
                        this.svgCenter.y +
                        ((this.layoutBounds.left - this.svgCenter.x) * sin) /
                            cos
                };
            case "top":
                return {
                    x:
                        this.svgCenter.x +
                        ((this.layoutBounds.top - this.svgCenter.y) * cos) /
                            sin,
                    y: this.layoutBounds.top
                };
            case "bottom":
                return {
                    x:
                        this.svgCenter.x +
                        ((this.layoutBounds.bottom - this.svgCenter.y) * cos) /
                            sin,
                    y: this.layoutBounds.bottom
                };
        }
    }

    private adjustForOverlap(
        positions: NodePosition[],
        newPos: Point,
        spacing: number
    ): Point {
        let adjusted = { ...newPos };
        let hasOverlap = true;
        let attempts = 0;
        const maxAttempts = 10;

        while (hasOverlap && attempts < maxAttempts) {
            hasOverlap = false;
            for (const pos of positions) {
                const distance = Math.sqrt(
                    Math.pow(adjusted.x - pos.position.x, 2) +
                        Math.pow(adjusted.y - pos.position.y, 2)
                );

                if (distance < spacing) {
                    hasOverlap = true;
                    // Move the point outward along its angle
                    const angle = Math.atan2(
                        adjusted.y - this.svgCenter.y,
                        adjusted.x - this.svgCenter.x
                    );
                    const moveDistance =
                        (spacing - distance) * this.spacingAdjustFactor;
                    adjusted.x += Math.cos(angle) * moveDistance;
                    adjusted.y += Math.sin(angle) * moveDistance;
                }
            }
            attempts++;
        }

        return adjusted;
    }

    public getPoints(): Point[] {
        return [];
    }

    public calculateLayout(
        components: ComponentPosition[]
    ): Map<string, NodePosition> {
        // Sort components by angle
        const sortedComponents = [...components].sort(
            (a, b) => a.angle - b.angle
        );

        const positions = new Map<string, NodePosition>();
        const placedPositions: NodePosition[] = [];

        for (const component of sortedComponents) {
            // Calculate initial position on rectangle
            let position = this.projectToRectangle(component.angle);
            console.log("node pos 1:", position);

            // Adjust for overlaps
            position = this.adjustForOverlap(
                placedPositions,
                position,
                this.config.minSpacing
            );
            console.log("node pos 2:", position);

            // Determine alignment based on position relative to center
            const alignment: "left" | "right" =
                position.x > this.svgCenter.x ? "left" : "right";

            const nodePosition: NodePosition = {
                position,
                alignment
            };

            positions.set(component.componentId, nodePosition);
            placedPositions.push(nodePosition);
        }

        return positions;
    }
}

// Factory for creating layout managers
export class LayoutManagerFactory {
    static createLayoutManager(
        type: "rectangular" | "hybrid" | "smart" | "hull-based",
        rootBounds: { x: number; y: number; width: number; height: number },
        svgCenter: Point,
        componentBounds: ComponentBoundsMap,
        config: RectangularLayoutConfig | HullBasedLayoutConfig
    ): BaseLayoutManager {
        switch (type) {
            case "rectangular":
                return new RectangularLayoutManager(
                    rootBounds,
                    svgCenter,
                    config as RectangularLayoutConfig
                );
            case "hull-based":
                return new HullBasedLayoutManager(
                    rootBounds,
                    svgCenter,
                    componentBounds,
                    config as HullBasedLayoutConfig
                );
            default:
                throw new Error(`Unknown layout type: ${type}`);
        }
    }
}

interface Vertex extends Point {
    index: number;
    isOccupied: boolean;
}

export interface HullBasedLayoutConfig extends BaseLayoutConfig {
    smoothingAngle: number; // Angle threshold for corner removal (in radians)
    placementDistance: number; // Initial distance from hull
    stepSize: number; // Distance to move along path when resolving overlaps
    minYSpacing: number // Minimum Y separation between labels... will check minSpacing if this is violated
}

export class HullBasedLayoutManager extends BaseLayoutManager {
    private componentBounds: ComponentBoundsMap;
    private vertices: Vertex[];
    private placements: Map<string, Vertex>; // Maps PP index to vertex
    readonly config: HullBasedLayoutConfig;

    constructor(
        rootBounds: { x: number; y: number; width: number; height: number },
        svgCenter: Point,
        componentBounds: ComponentBoundsMap,
        config: HullBasedLayoutConfig
    ) {
        super(rootBounds, svgCenter, config);
        this.config = config;
        this.componentBounds = componentBounds;
        this.vertices = [];
        this.placements = {} as Map<string, Vertex>;
    }

    private getBoundingPoints(): Point[] {
        const points: Point[] = [];
        Object.keys(this.componentBounds).forEach((id) => {
            if (id === "root") return;
            const bounds = this.componentBounds[id].bounds;
            points.push(
                { x: bounds.x, y: bounds.y },
                { x: bounds.x + bounds.width, y: bounds.y },
                { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
                { x: bounds.x, y: bounds.y + bounds.height }
            );
        });
        return points;
    }

    private findOptimalVertex(
        component: ComponentPosition,
        occupiedVertices: Set<number>
    ): Vertex {
        // Get unoccupied vertices and sort by distance to component
        const availableVertices = this.vertices.filter(
            (v) => !occupiedVertices.has(v.index)
        );
        const componentBound = this.componentBounds[component.componentId];

        if (!componentBound) {
            return this.vertices[0]; // Fallback to first vertex if no bounds found
        }

        // Sort vertices by distance to component center
        const sortedVertices = availableVertices.sort((a, b) => {
            const distA =
                Math.pow(a.x - componentBound.center.x, 2) +
                Math.pow(a.y - componentBound.center.y, 2);
            const distB =
                Math.pow(b.x - componentBound.center.x, 2) +
                Math.pow(b.y - componentBound.center.y, 2);
            return distA - distB;
        });

        let lastTriedVertex = sortedVertices[0];

        // Try each vertex in order of distance until we find one that meets minimum spacing
        for (const vertex of sortedVertices) {
            lastTriedVertex = vertex;
            let meetsMinimumSpacing = true;

            // Check distance against all occupied vertices
            for (const occupiedIndex of occupiedVertices) {
                const occupiedVertex = this.vertices[occupiedIndex];
                const dx = Math.abs(vertex.x - occupiedVertex.x);
                const dy = Math.abs(vertex.y - occupiedVertex.y);
                // updated logic - instead of distance, check dx and dy
                if (dy < this.config.minYSpacing && dx < this.config.minSpacing) {
                    meetsMinimumSpacing = false;
                    break;
                }
           }

            if (meetsMinimumSpacing) {
                return vertex;
            }
        }

        // If no vertex meets the spacing requirement, return the last tried vertex
        return lastTriedVertex;
    }

    public getPoints(): Point[] {
        const points = this.getBoundingPoints();
        const hull = findConcaveHull(points);
        const smoothedPoints = createSmoothHull(points);
        const offsetPoints = offsetPath(
            smoothedPoints,
            this.svgCenter,
            this.config.placementDistance
        );

        return offsetPoints;
    }

    public calculateLayout(
        components: ComponentPosition[]
    ): Map<string, NodePosition> {
        const positions = new Map<string, NodePosition>();
        const placedNodes: { id: string; position: Point }[] = [];

        const smoothedPoints = createSmoothHull(this.getBoundingPoints());
        const placementPath = offsetPath(
            smoothedPoints,
            this.svgCenter,
            this.config.placementDistance
        );
        this.vertices = placementPath.map((v, index) => {
            return {
                x: v.x,
                y: v.y,
                index: index,
                isOccupied: false
            } as Vertex;
        });

        const occupiedVertices = new Set<number>();

        for (const component of components) {
            // Find optimal vertex position for this component
            const vertex = this.findOptimalVertex(component, occupiedVertices);
            if (!vertex) {break;}
            // Mark vertex as occupied
            occupiedVertices.add(vertex.index);

            // Determine alignment based on component center
            const componentBound = this.componentBounds[component.componentId];
            const alignment =
                componentBound && componentBound.center
                    ? vertex.x <= componentBound.center.x
                        ? "left"
                        : "right"
                    : "left";

            // Store the position and alignment
            positions.set(component.componentId, {
                position: { x: vertex.x, y: vertex.y },
                alignment
            });
        }

        return positions;
    }
}
