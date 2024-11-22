import {
    CanvasSize,
    Shape,
    Point,
    Component,
    ComponentLibrary,
    DiagramComponent,
    AttachmentPoint,
    AttachmentPointMap,
    ParentAttachmentPointMap
} from "../Types";
import { v4 as uuidv4 } from "uuid";
import {
    compileDiagram,
    serializeDiagramComponents
} from "./diagramComponentsLib";
import { calculateSVGBoundingBox } from "./svgUtils";
import {
    getGlobalAttachmentPoints,
    getGlobalParentAttachmentPoints
} from "./diagramComponentsLib";

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

    private getNextRow(currentRow: string): string {
        return String.fromCharCode(currentRow.charCodeAt(0) + 1);
    }

    private getGridPosition(
        component: DiagramComponent,
        basePosition: GridPosition
    ): GridPosition {
        const position = component.position;

        if (position === "front-left") {
            return {
                row: basePosition.row,
                column: basePosition.column + 1
            };
        } else if (position === "front-right") {
            return {
                row: this.getNextRow(basePosition.row),
                column: basePosition.column
            };
        }

        return basePosition;
    }

    private addParentAttachmentPoints(
        attachmentPointsMap: AttachmentPointMap,
        parentAttachmentPoints: ParentAttachmentPointMap
    ): ParentAttachmentPointMap {
        Object.keys(attachmentPointsMap).forEach((name) => {
            if (!parentAttachmentPoints[name]) {
                parentAttachmentPoints[name]=[];
            }
            parentAttachmentPoints[name].push(attachmentPointsMap[name]);
        });
        return parentAttachmentPoints;
    }

    private processComponentAttachmentPoints(
        component: DiagramComponent,
        attachmentPoints: AttachmentPointMap,
        parentAttachmentPoints: ParentAttachmentPointMap,
        gridPosition: GridPosition,
        components: DiagramComponent[]
    ): void {
        // Add this component's parent attachment points
        this.addParentAttachmentPoints(
            getGlobalParentAttachmentPoints(component),
            parentAttachmentPoints
        );

        // Get this component's attachment points
        const componentPoints: AttachmentPointMap =
            getGlobalAttachmentPoints(component) || [];

        // Process attachment points based on position
        if (["top", "front-left", "front-right"].includes(component.position)) {
            // update the respective attachment point
            attachmentPoints[`attach-${component.position}`] =
                componentPoints[`attach-${component.position}`];

            // create or update grid-based attachment points
            const topPoint = componentPoints["attach-top"];
            if (topPoint) {
                const pointName = `attach-top-${gridPosition.row}${gridPosition.column}`;
                attachmentPoints[pointName] = { ...topPoint, name: pointName };
            }
        }

        // Process child components recursively
        const childComponents = components.filter(
            (c) => c.relativeToId === component.id
        );
        childComponents.forEach((child) => {
            const childGridPosition = this.getGridPosition(child, gridPosition);
            this.processComponentAttachmentPoints(
                child,
                attachmentPoints,
                parentAttachmentPoints,
                childGridPosition,
                components
            );
        });
    }

    private getNormalizedParentAttachmentPoints(
        parentAttachmentPoints: ParentAttachmentPointMap,
        attachmentPoints: AttachmentPointMap
    ): AttachmentPointMap {
        console.log('parent points',parentAttachmentPoints);
        Object.keys(parentAttachmentPoints).forEach((name) => {
            if (parentAttachmentPoints[name].length>0) {
                const normalizedPoint:Point = {x:0, y:0};
                parentAttachmentPoints[name].forEach((point) => {
                    normalizedPoint.x += Math.round(point.x);
                    normalizedPoint.y += Math.round(point.y);
                });
                console.log('p:',name,'x:',normalizedPoint.x,'y:',normalizedPoint.y);
                normalizedPoint.x = normalizedPoint.x / parentAttachmentPoints[name].length;
                normalizedPoint.y = normalizedPoint.y / parentAttachmentPoints[name].length;
                console.log('np:',name,'x:',normalizedPoint.x,'y:',normalizedPoint.y);
                attachmentPoints[name] = {
                    name,
                    ...normalizedPoint
                }
            }
        });
        return attachmentPoints;
    }

    private getAttachmentPoints(
        components: DiagramComponent[]
    ): AttachmentPoint[] {
        if (!components.length) return [];

        // Get the first 3D shape (root component)
        const rootComponent = components[0];
        if (!rootComponent.attachmentPoints) return [];

        // Initialize attachment points map with root component's points
        const attachmentPointsMap: AttachmentPointMap =
            getGlobalAttachmentPoints(rootComponent);
        const parentAttachmentPointsMap: ParentAttachmentPointMap =
            this.addParentAttachmentPoints(
                getGlobalParentAttachmentPoints(rootComponent),
                {}
            );

        // Start processing from the root with initial grid position
        const initialGridPosition: GridPosition = { row: "a", column: 1 };
        // add the first grid attachment point
        attachmentPointsMap["attach-top-a1"] = {
            ...(attachmentPointsMap["attach-top"] || {}),
            name: "attach-top-a1"
        };

        // remember how many points are there
        const numPoints = Object.keys(attachmentPointsMap).length;

        // Process children of root component
        const childComponents = components.filter(
            (c) => c.relativeToId === rootComponent.id
        );
        childComponents.forEach((child) => {
            const childGridPosition = this.getGridPosition(
                child,
                initialGridPosition
            );
            this.processComponentAttachmentPoints(
                child,
                attachmentPointsMap,
                parentAttachmentPointsMap,
                childGridPosition,
                components
            );
        });

        // if no new grid attachment points got added, remove the first grid point
        if (Object.keys(attachmentPointsMap).length === numPoints) {
            delete attachmentPointsMap["attach-top-a1"];
        }

        // overwrite attachment points with normalized parent attahment points, if any
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
        overwrite: boolean = false
    ): Component | null {
        if (this.hasComponent(name) && !overwrite) {
            return null;
        }

        const now = new Date();

        // Create deep copy of diagram components to avoid reference issues
        const componentsCopy = JSON.parse(JSON.stringify(diagramComponents));

        const component: Component = {
            id: name,
            name,
            description,
            diagramComponents: componentsCopy,
            attachmentPoints: this.getAttachmentPoints(diagramComponents),
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

        const wrappedSvg: string = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="${boundingBox.x} ${boundingBox.y} ${boundingBox.width} ${boundingBox.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                ${svgRender}
            </svg>
        `;
        // TODO: We need to remove all attachment points in the svgContent of the individual shapes and add only the component's attachment points
        // this is required to allow proper selection of the component and attachment points from the SVGNode

        // Create a temporary container to parse and modify the SVG
        const parser = new DOMParser();
        // Wrap the content in an SVG tag for proper parsing
        const doc = parser.parseFromString(wrappedSvg, "image/svg+xml");
        const svg = doc.documentElement;

        // Remove all existing attachment points
        const existingPoints = svg.querySelectorAll('circle[id^="attach-"]');
        existingPoints.forEach((point) => point.remove());

        // Remove all existing parent attachment points
        const existingParentPoints = svg.querySelectorAll('circle[id^="parent-attach-"]');
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
            circle.setAttribute("r", "1");
            circle.setAttribute("fill", "red");
            //circle.setAttribute('style', 'display: none;'); // Hidden by default
            svg.appendChild(circle);
        });

        const serializer = new XMLSerializer();
        const svgContent = serializer.serializeToString(svg);

        // Update the component with the new SVG content
        this.updateComponent(id, { svgContent });
        return svgContent;
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
