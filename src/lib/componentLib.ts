// @/lib/componentLib.ts

import {
    CanvasSize,
    Shape,
    Point,
    Component,
    ComponentLibrary,
    DiagramComponent,
    AttachmentPoint,
    AttachmentPointMap,
    ComponentAttachmentPointMap,
    GlobalAttachmentPoint,
    Direction,
    DependencyResult
} from "../Types";
import { v4 as uuidv4 } from "uuid";
import {
    compileDiagram,
    findBottomMostComponents,
    findTopMostComponents,
    getExtremeAttachmentPoints,
    serializeDiagramComponents
} from "./diagramComponentsLib";
import { calculateSVGBoundingBox } from "./svgUtils";
import {
    getGlobalAttachmentPoints,
    getGlobalParentAttachmentPoints
} from "./diagramComponentsLib";
import {
    findCenterPoint,
    getNormalizeAttachmentPoints,
    createGridPoints
} from "./pointUtils";
import { getAttachmentPoint } from "./diagramComponentsLib";
import { Underline } from "lucide-react";
import { shapesLibraryManager } from "./shapesLib";

// Helper interfaces for attachment point calculation

interface GridPosition {
    row: string; // 'A', 'B', 'C', etc.
    column: number;
}

class ComponentLibraryManager {
    private static instance: ComponentLibraryManager;
    private library: ComponentLibrary;

    private constructor() {
        this.library = this.loadLibrary();
    }

    public static getInstance(): ComponentLibraryManager {
        if (!ComponentLibraryManager.instance) {
            ComponentLibraryManager.instance = new ComponentLibraryManager();
        }
        return ComponentLibraryManager.instance;
    }

    private loadLibrary(): ComponentLibrary {
        const savedLibrary = localStorage.getItem("componentLibrary");
        if (savedLibrary) {
            const parsed = JSON.parse(savedLibrary);
            return {
                ...parsed,
                lastModified: new Date(parsed.lastModified)
            };
        }
        return {
            components: {},
            lastModified: new Date()
        };
    }

    private saveLibrary(): void {
        localStorage.setItem("componentLibrary", JSON.stringify(this.library));
    }

    private addComponentAttachmentPoints(
        attachmentPointsMap: AttachmentPointMap,
        parentAttachmentPoints: ComponentAttachmentPointMap
    ): ComponentAttachmentPointMap {
        Object.keys(attachmentPointsMap).forEach((name) => {
            if (!parentAttachmentPoints[name]) {
                parentAttachmentPoints[name] = [];
            }
            parentAttachmentPoints[name].push(attachmentPointsMap[name]);
        });
        return parentAttachmentPoints;
    }

    private getNormalizedParentAttachmentPoints(
        parentAttachmentPoints: ComponentAttachmentPointMap,
        attachmentPoints: AttachmentPointMap
    ): AttachmentPointMap {
        Object.keys(parentAttachmentPoints).forEach((name) => {
            const centerPoint: Point | null = findCenterPoint(
                parentAttachmentPoints[name]
            );
            if (centerPoint) {
                attachmentPoints[name] = {
                    name,
                    ...centerPoint
                };
            }
        });
        return attachmentPoints;
    }

    private handleSideAttachments(
        side: { side: string; opposite: string },
        bottomLayer: DiagramComponent[],
        direction: string,
        allAttachmentPoints: ComponentAttachmentPointMap,
        parentAttachmentPointsMap: ComponentAttachmentPointMap
    ): void {
        console.log("selecting side points for side", side.side);

        // Handle back points
        const backMostLayer = findBottomMostComponents(bottomLayer, direction);
        console.log("back most components", backMostLayer);

        const backPoints = this.collectAttachmentPoints(
            backMostLayer,
            `attach-back-${side.opposite}`,
            "backmost"
        );

        if (backPoints.points.length > 0) {
            allAttachmentPoints[`attach-back-${side.opposite}`] =
                backPoints.points;
        }
        if (backPoints.parentPoints.length > 0) {
            parentAttachmentPointsMap[`attach-back-${side.opposite}`] =
                backPoints.parentPoints;
        }
        console.log(
            "collected back points:",
            parentAttachmentPointsMap,
            allAttachmentPoints
        );

        // Handle front points
        const frontMostLayer = findTopMostComponents(bottomLayer, direction);
        console.log("front most components", frontMostLayer);

        const frontPoints = this.collectAttachmentPoints(
            frontMostLayer,
            `attach-front-${side.side}`,
            "front most"
        );

        if (frontPoints.points.length > 0) {
            allAttachmentPoints[`attach-front-${side.side}`] =
                frontPoints.points;
        }
        if (frontPoints.parentPoints.length > 0) {
            parentAttachmentPointsMap[`attach-front-${side.side}`] =
                frontPoints.parentPoints;
        }
        console.log(
            "collected front points:",
            parentAttachmentPointsMap,
            allAttachmentPoints
        );
    }

    private collectAttachmentPoints(
        components: DiagramComponent[],
        attachmentKey: string,
        logPrefix: string
    ): { points: AttachmentPoint[]; parentPoints: AttachmentPoint[] } {
        const points: AttachmentPoint[] = [];
        const parentPoints: AttachmentPoint[] = [];

        components.forEach((component) => {
            const globalPoints = getGlobalAttachmentPoints(component);
            const globalParentPoints =
                getGlobalParentAttachmentPoints(component);
            console.log(
                ` --> ${logPrefix} points`,
                globalPoints,
                globalParentPoints
            );

            if (globalPoints[attachmentKey]) {
                points.push(globalPoints[attachmentKey]);
                console.log(globalPoints[attachmentKey]);
            }
            if (globalParentPoints[attachmentKey]) {
                parentPoints.push(globalParentPoints[attachmentKey]);
                console.log(globalParentPoints[attachmentKey]);
            }
        });

        return { points, parentPoints };
    }

    private handleTopAttachments(
        components: DiagramComponent[],
        allAttachmentPoints: ComponentAttachmentPointMap,
        attachmentPointsMap: AttachmentPointMap
    ): void {
        const topLayer = findTopMostComponents(components);
        const topPoints: AttachmentPoint[] = [];

        // First try to collect points with "attach-top-" prefix
        this.collectTopPoints(topLayer, "attach-top-", topPoints);

        // If no points found, try with exact "attach-top"
        if (topPoints.length === 0) {
            this.collectTopPoints(topLayer, "attach-top", topPoints);
        }

        console.log("topPoints:", topPoints);
        if (topPoints.length > 0 && topPoints[0] != undefined) {
            allAttachmentPoints["attach-top"] = topPoints;
            const gridPoints = createGridPoints(
                topPoints,
                Direction.N,
                Direction.W
            );
            gridPoints.forEach((point) => {
                attachmentPointsMap[point.name] = point;
            });
        }
    }

    private collectTopPoints(
        components: DiagramComponent[],
        prefix: string,
        topPoints: AttachmentPoint[]
    ): void {
        components.forEach((component) => {
            const points = getGlobalAttachmentPoints(component);
            Object.keys(points).forEach((p) => {
                if (
                    prefix === "attach-top-"
                        ? p.startsWith(prefix)
                        : p === prefix
                ) {
                    const topPoint = points[p];
                    topPoint.name = "attach-top";
                    topPoints.push(topPoint);
                }
            });
        });
    }

    private handleNonStandardPoints(
        components: DiagramComponent[],
        attachmentPointsMap: AttachmentPointMap
    ): void {
        const standardPoints = new Set([
            "attach-top",
            "attach-bottom",
            "attach-front-left",
            "attach-front-right",
            "attach-back-left",
            "attach-back-right"
        ]);

        const nonStandardPoints: ComponentAttachmentPointMap = {};

        components.forEach((component) => {
            const points = getGlobalAttachmentPoints(component);
            Object.keys(points).forEach((p) => {
                if (!p.startsWith("attach-top-") && !standardPoints.has(p)) {
                    (nonStandardPoints[p] = nonStandardPoints[p] || []).push(
                        points[p]
                    );
                }
            });
        });

        if (Object.keys(nonStandardPoints).length > 0) {
            Object.keys(nonStandardPoints).forEach((p) => {
                const gridPoints = createGridPoints(
                    nonStandardPoints[p],
                    Direction.N,
                    Direction.W
                );
                gridPoints.forEach((point) => {
                    attachmentPointsMap[point.name] = point;
                });
            });
        }
    }

    private getAttachmentPoints(
        components: DiagramComponent[]
    ): AttachmentPoint[] {
        if (!components.length) return [];

        const rootComponent = components[0];
        if (!rootComponent.attachmentPoints) return [];

        const attachmentPointsMap: AttachmentPointMap = {};
        const parentAttachmentPointsMap: ComponentAttachmentPointMap = {};
        const allAttachmentPoints: ComponentAttachmentPointMap = {};

        console.log("Extracting attachment points...");

        // Handle bottom layer points
        const bottomLayer = findBottomMostComponents(components);
        bottomLayer.forEach((component) => {
            this.addComponentAttachmentPoints(
                getGlobalParentAttachmentPoints(component),
                parentAttachmentPointsMap
            );
            this.addComponentAttachmentPoints(
                getGlobalAttachmentPoints(component),
                allAttachmentPoints
            );
        });

        console.log(
            "collected bottom layer points:",
            parentAttachmentPointsMap,
            allAttachmentPoints
        );

        // Handle side attachment points
        const sides = [
            { side: "left", opposite: "right" },
            { side: "right", opposite: "left" }
        ];

        sides.forEach((side) => {
            const direction = `front-${side.side}`;
            this.handleSideAttachments(
                side,
                bottomLayer,
                direction,
                allAttachmentPoints,
                parentAttachmentPointsMap
            );
        });

        // Handle non-standard points
        this.handleNonStandardPoints(components, attachmentPointsMap);

        // Handle top attachment points
        this.handleTopAttachments(
            components,
            allAttachmentPoints,
            attachmentPointsMap
        );

        // Normalize points
        getNormalizeAttachmentPoints(allAttachmentPoints, attachmentPointsMap);

        // Add normalized parent points
        this.getNormalizedParentAttachmentPoints(
            parentAttachmentPointsMap,
            attachmentPointsMap
        );

        return Object.values(attachmentPointsMap);
    }

    private getAttachmentPointsOld(
        components: DiagramComponent[]
    ): AttachmentPoint[] {
        if (!components.length) return [];

        // Get the first 3D shape (root component)
        const rootComponent = components[0];
        if (!rootComponent.attachmentPoints) return [];

        // Initialize attachment points map, parent attachment points map and final attachment points for component
        const attachmentPointsMap: AttachmentPointMap = {};
        const parentAttachmentPointsMap: ComponentAttachmentPointMap = {};
        const allAttachmentPoints: ComponentAttachmentPointMap = {};

        console.log("Extracting attachment points...");

        // for all standard attachment points, only choose the bottom layer
        const bottomLayer = findBottomMostComponents(components);
        bottomLayer.forEach((component) => {
            this.addComponentAttachmentPoints(
                getGlobalParentAttachmentPoints(component),
                parentAttachmentPointsMap
            );
            this.addComponentAttachmentPoints(
                getGlobalAttachmentPoints(component),
                allAttachmentPoints
            );
        });

        console.log(
            "collected bottom layer points:",
            parentAttachmentPointsMap,
            allAttachmentPoints
        );

        const sides = [
            {
                side: "left",
                opposite: "right"
            },
            {
                side: "right",
                opposite: "left"
            }
        ];
        // For left and right sides, get the back and front most components
        sides.forEach((side) => {
            console.log("selecting side points for side ", side.side);
            const direction = `front-${side.side}`;
            const backMostLayer = findBottomMostComponents(
                bottomLayer,
                direction
            );
            const backMostPoints: AttachmentPoint[] = [];
            const backMostParentPoints: AttachmentPoint[] = [];
            console.log("back most components", backMostLayer);
            backMostLayer.forEach((component) => {
                const points = getGlobalAttachmentPoints(component);
                const parentPoints = getGlobalParentAttachmentPoints(component);
                console.log(" --> backmost points", points, parentPoints);
                if (points[`attach-back-${side.opposite}`]) {
                    backMostPoints.push(points[`attach-back-${side.opposite}`]);
                    console.log(points[`attach-back-${side.opposite}`]);
                }
                if (parentPoints[`attach-back-${side.opposite}`]) {
                    backMostParentPoints.push(
                        parentPoints[`attach-back-${side.opposite}`]
                    );
                    console.log(parentPoints[`attach-back-${side.opposite}`]);
                }
            });
            if (backMostPoints.length > 0) {
                allAttachmentPoints[`attach-back-${side.opposite}`] =
                    backMostPoints;
            }
            if (backMostParentPoints.length > 0) {
                parentAttachmentPointsMap[`attach-back-${side.opposite}`] =
                    backMostParentPoints;
            }
            console.log(
                "collected back points:",
                parentAttachmentPointsMap,
                allAttachmentPoints
            );

            const frontMostLayer = findTopMostComponents(
                bottomLayer,
                direction
            );
            const frontMostPoints: AttachmentPoint[] = [];
            const frontMostParentPoints: AttachmentPoint[] = [];
            console.log("front most components", frontMostLayer);

            frontMostLayer.forEach((component) => {
                const points = getGlobalAttachmentPoints(component);
                const parentPoints = getGlobalParentAttachmentPoints(component);
                console.log(" --> front most points", points, parentPoints);
                if (points[`attach-front-${side.side}`]) {
                    frontMostPoints.push(points[`attach-front-${side.side}`]);
                    console.log(points[`attach-front-${side.side}`]);
                }
                if (parentPoints[`attach-front-${side.side}`]) {
                    frontMostParentPoints.push(
                        parentPoints[`attach-front-${side.side}`]
                    );
                    console.log(parentPoints[`attach-front-${side.side}`]);
                }
            });
            if (frontMostPoints.length > 0) {
                allAttachmentPoints[`attach-front-${side.side}`] =
                    frontMostPoints;
            }
            if (frontMostParentPoints.length > 0) {
                parentAttachmentPointsMap[`attach-front-${side.side}`] =
                    frontMostParentPoints;
            }
            console.log(
                "collected front points:",
                parentAttachmentPointsMap,
                allAttachmentPoints
            );
        });

        // check for all non-standard attachment points and create a grid for them
        const nonStandardPoints: ComponentAttachmentPointMap = {};
        components.forEach((component) => {
            const points = getGlobalAttachmentPoints(component);
            Object.keys(points).forEach((p) => {
                if (
                    !p.startsWith("attach-top-") &&
                    ![
                        "attach-top",
                        "attach-bottom",
                        "attach-front-left",
                        "attach-front-right",
                        "attach-back-left",
                        "attach-back-right"
                    ].includes(p)
                ) {
                    (nonStandardPoints[p] = nonStandardPoints[p] || []).push(
                        points[p]
                    );
                }
            });
        });
        if (Object.keys(nonStandardPoints).length > 0) {
            //console.log("non std points:", nonStandardPoints);
            Object.keys(nonStandardPoints).forEach((p) => {
                const gridPoints = createGridPoints(
                    nonStandardPoints[p],
                    Direction.N,
                    Direction.W
                );
                gridPoints.forEach((point) => {
                    attachmentPointsMap[point.name] = point;
                });
            });
        }

        // For top attachment points, get attachment points of the top most layer
        const topLayer = findTopMostComponents(components);
        const topPoints: AttachmentPoint[] = [];
        topLayer.forEach((component) => {
            const points = getGlobalAttachmentPoints(component);
            Object.keys(points).forEach((p) => {
                if (p.startsWith("attach-top-")) {
                    const topPoint = points[p];
                    topPoint.name = "attach-top";
                    topPoints.push(topPoint);
                }
            });
        });
        if (topPoints.length === 0) {
            topLayer.forEach((component) => {
                const points = getGlobalAttachmentPoints(component);
                Object.keys(points).forEach((p) => {
                    if (p === "attach-top") {
                        const topPoint = points[p];
                        topPoint.name = "attach-top";
                        topPoints.push(topPoint);
                    }
                });
            });
        }
        console.log("topPoints:", topPoints);
        if (topPoints.length > 0 && topPoints[0] != undefined) {
            allAttachmentPoints["attach-top"] = topPoints;
            const gridPoints = createGridPoints(
                topPoints,
                Direction.N,
                Direction.W
            );
            gridPoints.forEach((point) => {
                attachmentPointsMap[point.name] = point;
            });
        }
        // Combine all attachment points into normalized attachment points for the component
        getNormalizeAttachmentPoints(allAttachmentPoints, attachmentPointsMap);

        // Create a grid of top attachment points using only the topmost components
        if (topPoints.length > 1) {
        }

        // overwrite attachment points with normalized parent attachment points, if any
        this.getNormalizedParentAttachmentPoints(
            parentAttachmentPointsMap,
            attachmentPointsMap
        );

        // Convert map back to array
        return Object.values(attachmentPointsMap);
    }

    private validateComponentLibrary = (data: any): boolean => {
        // Check if data is an array
        if (!Array.isArray(data)) return false;

        // Loop through each component in the array
        for (const component of data) {
            // Validate top-level required fields for each component
            if (
                typeof component.id !== "string" ||
                typeof component.name !== "string" ||
                typeof component.description !== "string"
            ) {
                return false;
            }

            // Validate diagramComponents array
            if (!Array.isArray(component.diagramComponents)) return false;

            // Loop through each diagramComponent inside the component
            for (const diagramComponent of component.diagramComponents) {
                // Check required fields in each diagramComponent
                if (
                    typeof diagramComponent.id !== "string" ||
                    typeof diagramComponent.shape !== "string" ||
                    typeof diagramComponent.position !== "string"
                ) {
                    return false;
                }

                if (!Array.isArray(diagramComponent.attached2DShapes))
                    return false;

                // Validate attached2DShapes
                for (const shape of diagramComponent.attached2DShapes) {
                    if (
                        typeof shape.name !== "string" ||
                        typeof shape.attachedTo !== "string"
                    ) {
                        return false;
                    }
                }

                // Validate optional metadata fields in diagramComponent
                if (
                    diagramComponent.type !== undefined &&
                    typeof diagramComponent.type !== "string"
                ) {
                    return false;
                }

                if (
                    diagramComponent.metadata !== undefined &&
                    typeof diagramComponent.metadata !== "object"
                ) {
                    return false;
                }
            }
        }

        // If all components and their nested structure are valid, return true
        return true;
    };

    public hasComponent(name: string): boolean {
        return Object.values(this.library.components).some(
            (component) => component.name === name
        );
    }

    public createComponent(
        name: string,
        description: string,
        diagramComponents: DiagramComponent[],
        canvasSize: CanvasSize,
        svgLibrary: Shape[],
        overwrite: boolean = false
    ): Component | null {
        if (this.hasComponent(name) && !overwrite) {
            return null;
        }

        const now = new Date();

        // Create deep copy of diagram components to avoid reference issues
        const componentsCopy = JSON.parse(JSON.stringify(diagramComponents));
        // detach the root from its parent and move it to the center
        componentsCopy[0].relativeToId = null;
        componentsCopy[0].absolutePosition = {
            x: canvasSize.width / 2,
            y: canvasSize.height / 2
        };
        // compile the shapes, so that all the internal shapes' absolute positions are updated
        const { svgContent, processedComponents } = compileDiagram(
            componentsCopy,
            canvasSize,
            svgLibrary,
            false
        );

        const component: Component = {
            id: name,
            name,
            description,
            diagramComponents: processedComponents,
            attachmentPoints: this.getAttachmentPoints(processedComponents),
            created: now,
            lastModified: now
        };

        this.library.components[name] = component;
        this.library.lastModified = now;
        this.saveLibrary();

        return component;
    }

    public serializeComponentLib = (): Component[] => {
        const components = this.getAllComponents();

        const serializeComponentWithDiagrams = (component: Component) => ({
            id: component.id,
            name: component.name,
            description: component.description,
            attachmentPoints: component.attachmentPoints,
            created: component.created,
            lastModified: component.lastModified,
            diagramComponents: serializeDiagramComponents(
                component.diagramComponents,
                true
            )
        });
        return components.map(serializeComponentWithDiagrams);
    };

    public deserializeComponentLib = (components: Component[]) => {
        if (!this.validateComponentLibrary(components)) {
            throw new Error("Invalid component library structure");
        }
        console.trace();

        components.forEach((component) => {
            const now = new Date();
            this.library.components[component.name] = component;
            this.library.lastModified = now;
            this.saveLibrary();
        });
    };

    public renderComponent(
        id: string,
        canvasSize: CanvasSize,
        svgLibrary: Shape[],
        fetchedComponent?: Component
    ): string {
        const componentFromLib = this.library.components[id];
        const component = componentFromLib || fetchedComponent;
        if (!component) {
            throw new Error(`Component with id ${id} not found`);
        }
        const { svgContent: svgRender } = compileDiagram(
            component.diagramComponents,
            canvasSize,
            svgLibrary,
            false
        );

        const boundingBox = calculateSVGBoundingBox(svgRender, canvasSize) || {
            x: 0,
            y: 0,
            width: "100%",
            height: "100%"
        };

        const wrappedSvg: string = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="${boundingBox.x} ${boundingBox.y} ${boundingBox.width} ${boundingBox.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                ${svgRender}
            </svg>
        `;
        // Create a temporary container to parse and modify the SVG
        const parser = new DOMParser();
        // Wrap the content in an SVG tag for proper parsing
        const doc = parser.parseFromString(wrappedSvg, "image/svg+xml");
        const svg = doc.documentElement;

        // Remove all existing attachment points
        const existingPoints = svg.querySelectorAll('circle[id^="attach-"]');
        existingPoints.forEach((point) => point.remove());

        // Remove all existing parent attachment points
        const existingParentPoints = svg.querySelectorAll(
            'circle[id^="parent-attach-"]'
        );
        existingParentPoints.forEach((point) => point.remove());

        // Remove all shape IDs from internal elements
        const shapesWithIds = svg.querySelectorAll('g[id^="shape-"]');
        shapesWithIds.forEach((shape) => shape.removeAttribute("id"));

        // Create SVG namespace element for creating new elements
        const svgNS = "http://www.w3.org/2000/svg";

        // Add new attachment points based on component's attachment points
        component.attachmentPoints.forEach((point) => {
            const circle = document.createElementNS(svgNS, "circle");
            circle.setAttribute("id", point.name);
            circle.setAttribute("cx", point.x.toString());
            circle.setAttribute("cy", point.y.toString());
            circle.setAttribute("r", "3");
            circle.setAttribute("fill", "red");
            //circle.setAttribute('style', 'display: none;'); // Hidden by default
            svg.appendChild(circle);
        });

        const serializer = new XMLSerializer();
        const svgContent = serializer.serializeToString(svg);

        // Update the component with the new SVG content
        if (componentFromLib) this.updateComponent(id, { svgContent });

        return svgRender ? svgContent : "";
    }

    public renderComponentOld(
        id: string,
        canvasSize: CanvasSize,
        svgLibrary: Shape[]
    ): string {
        const component = this.library.components[id];
        if (!component) {
            throw new Error(`Component with id ${id} not found`);
        }
        const { svgContent: svgRender } = compileDiagram(
            component.diagramComponents,
            canvasSize,
            svgLibrary,
            false
        );
        const boundingBox = calculateSVGBoundingBox(svgRender, canvasSize) || {
            x: 0,
            y: 0,
            width: "100%",
            height: "100%"
        };
        const svgContent: string = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="${boundingBox.x} ${boundingBox.y} ${boundingBox.width} ${boundingBox.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                ${svgRender}
            </svg>
        `;
        // TODO: We need to remove all attachment points in the svgContent of the individual shapes and add only the component's attachment points
        // this is required to allow proper selection of the component and attachment points from the SVGNode
        this.updateComponent(id, { svgContent });
        return svgContent;
    }

    public renderAllComponents(canvasSize: CanvasSize, svgLibrary: Shape[]) {
        this.getAllComponents().forEach((component) => {
            this.renderComponent(component.id, canvasSize, svgLibrary);
        });
    }

    public updateComponent(
        id: string,
        updates: Partial<Omit<Component, "id" | "created">>
    ): Component {
        const component = this.library.components[id];
        if (!component) {
            throw new Error(`Component with id ${id} not found`);
        }

        const updatedComponent = {
            ...component,
            ...updates,
            lastModified: new Date()
        };

        this.library.components[id] = updatedComponent;
        this.library.lastModified = new Date();
        this.saveLibrary();

        return updatedComponent;
    }

    public deleteComponent(id: string): void {
        if (!this.library.components[id]) {
            throw new Error(`Component with id ${id} not found`);
        }

        delete this.library.components[id];
        this.library.lastModified = new Date();
        this.saveLibrary();
    }

    public getComponent(id: string): Component | null {
        return this.library.components[id] || null;
    }

    public getAllComponents(): Component[] {
        return Object.values(this.library.components);
    }
    public getAllComponentsMap(): { [key: string]: Component } {
        return this.library.components;
    }

    public clearLibrary(): void {
        this.library = {
            components: {},
            lastModified: new Date()
        };
        this.saveLibrary();
    }

    // Helper method to create a new diagram component from a component
    public createDiagramComponentFromComponent(
        componentId: string,
        position: string = "center",
        relativeToId: string | null = null
    ): DiagramComponent | null {
        const component = this.getComponent(componentId);
        if (!component) return null;

        return {
            id: uuidv4(),
            shape: componentId, // Store the component ID in shape field
            source: "component",
            position,
            relativeToId,
            attached2DShapes: [],
            attachmentPoints: component.attachmentPoints
        };
    }
}

export const componentLibraryManager = ComponentLibraryManager.getInstance();
