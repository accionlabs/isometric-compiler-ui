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
    Direction
} from "../Types";
import { v4 as uuidv4 } from "uuid";
import {
    compileDiagram,
    findBottomMostComponents,
    findTopMostComponents,
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

class ComponentLibraryManager {
    private static instance: ComponentLibraryManager;
    private library: ComponentLibrary;

    // Private constructor to prevent direct instantiation
    private constructor(initialLibrary?: ComponentLibrary) {
        this.library = initialLibrary || {
            components: {},
            lastModified: new Date()
        };
    }

    // Singleton getInstance method
    public static getInstance(
        initialLibrary?: ComponentLibrary
    ): ComponentLibraryManager {
        if (!ComponentLibraryManager.instance) {
            ComponentLibraryManager.instance = new ComponentLibraryManager(
                initialLibrary
            );
        } else if (initialLibrary) {
            ComponentLibraryManager.instance.deserializeComponentLib(
                Object.values(initialLibrary.components)
            );
        }
        return ComponentLibraryManager.instance;
    }

    // Reset the singleton instance
    public static reset(): void {
        ComponentLibraryManager.instance = undefined;
    }

    // Private helper method for adding component attachment points
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

    // Private method to normalize parent attachment points
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

    // Complex method to calculate attachment points
    private getAttachmentPoints(
        components: DiagramComponent[]
    ): AttachmentPoint[] {
        if (!components.length) return [];

        const rootComponent = components[0];
        if (!rootComponent.attachmentPoints) return [];

        const attachmentPointsMap: AttachmentPointMap = {};
        const parentAttachmentPointsMap: ComponentAttachmentPointMap = {};
        const allAttachmentPoints: ComponentAttachmentPointMap = {};

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

        // Handle non-standard attachment points
        const nonStandardPoints: ComponentAttachmentPointMap = {};
        components.forEach((component) => {
            const points = getGlobalAttachmentPoints(component);
            Object.keys(points).forEach((p) => {
                if (
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
            console.log("non std points:", nonStandardPoints);
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

        // Handle top attachment points
        const topLayer = findTopMostComponents(components);
        const topPoints: AttachmentPoint[] = [];
        topLayer.forEach((component) => {
            const points = getGlobalAttachmentPoints(component);
            if (points["attach-top"]) {
                topPoints.push(points["attach-top"]);
            }
        });

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

        getNormalizeAttachmentPoints(allAttachmentPoints, attachmentPointsMap);

        this.getNormalizedParentAttachmentPoints(
            parentAttachmentPointsMap,
            attachmentPointsMap
        );

        return Object.values(attachmentPointsMap);
    }

    // Validate component library structure
    private validateComponentLibrary = (data: any): boolean => {
        if (!Array.isArray(data)) return false;

        for (const component of data) {
            if (
                typeof component.id !== "string" ||
                typeof component.name !== "string" ||
                typeof component.description !== "string"
            ) {
                return false;
            }

            if (!Array.isArray(component.diagramComponents)) return false;

            for (const diagramComponent of component.diagramComponents) {
                if (
                    typeof diagramComponent.id !== "string" ||
                    typeof diagramComponent.shape !== "string" ||
                    typeof diagramComponent.position !== "string"
                ) {
                    return false;
                }

                if (!Array.isArray(diagramComponent.attached2DShapes))
                    return false;

                for (const shape of diagramComponent.attached2DShapes) {
                    if (
                        typeof shape.name !== "string" ||
                        typeof shape.attachedTo !== "string"
                    ) {
                        return false;
                    }
                }

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

        return true;
    };

    // Check if a component exists
    public hasComponent(name: string): boolean {
        return Object.values(this.library.components).some(
            (component) => component.name === name
        );
    }

    // Create a new component
    public createComponent(
        name: string,
        description: string,
        diagramComponents: DiagramComponent[],
        canvasSize: CanvasSize,
        svgLibrary: Shape[],
        overwrite: boolean = false,
        saveCallback?: (library: ComponentLibrary) => void
    ): Component | null {
        if (this.hasComponent(name) && !overwrite) {
            return null;
        }

        const now = new Date();

        const componentsCopy = JSON.parse(JSON.stringify(diagramComponents));
        componentsCopy[0].relativeToId = null;
        componentsCopy[0].absolutePosition = {
            x: canvasSize.width / 2,
            y: canvasSize.height / 2
        };

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

        if (saveCallback) {
            saveCallback(this.library);
        }

        return component;
    }

    // Serialize the component library
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

    // Deserialize and load component library
    public deserializeComponentLib = (
        components: Component[],
        saveCallback?: (library: ComponentLibrary) => void
    ) => {
        if (!this.validateComponentLibrary(components)) {
            throw new Error("Invalid component library structure");
        }

        const now = new Date();
        components.forEach((component) => {
            this.library.components[component.name] = component;
        });

        this.library.lastModified = now;

        if (saveCallback) {
            saveCallback(this.library);
        }
    };

    // Render a specific component
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

        const parser = new DOMParser();
        const doc = parser.parseFromString(wrappedSvg, "image/svg+xml");
        const svg = doc.querySelector("svg");
        if (!svg) {
            throw new Error("Failed to parse SVG content");
        }

        // Remove existing attachment points and shape IDs
        svg.querySelectorAll('circle[id^="attach-"]').forEach((point) =>
            point.remove()
        );
        svg.querySelectorAll('circle[id^="parent-attach-"]').forEach((point) =>
            point.remove()
        );
        svg.querySelectorAll('g[id^="shape-"]').forEach((shape) =>
            shape.removeAttribute("id")
        );

        // Add attachment points
        const svgNS = "http://www.w3.org/2000/svg";
        component.attachmentPoints.forEach((point) => {
            const circle = document.createElementNS(svgNS, "circle");
            circle.setAttribute("id", point.name);
            circle.setAttribute("cx", point.x.toString());
            circle.setAttribute("cy", point.y.toString());
            circle.setAttribute("r", "3");
            circle.setAttribute("fill", "red");
            svg.appendChild(circle);
        });

        const serializer = new XMLSerializer();
        const svgContent = serializer.serializeToString(svg);

        this.updateComponent(id, { svgContent });

        return svgContent;
    }

    // Update a component
    public updateComponent(
        id: string,
        updates: Partial<Omit<Component, "id" | "created">>,
        saveCallback?: (library: ComponentLibrary) => void
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

        if (saveCallback) {
            saveCallback(this.library);
        }

        return updatedComponent;
    }

    // Delete a component
    public deleteComponent(
        id: string,
        saveCallback?: (library: ComponentLibrary) => void
    ): void {
        if (!this.library.components[id]) {
            throw new Error(`Component with id ${id} not found`);
        }

        delete this.library.components[id];
        this.library.lastModified = new Date();

        if (saveCallback) {
            saveCallback(this.library);
        }
    }

    // Get a specific component
    public getComponent(id: string): Component | null {
        return this.library.components[id] || null;
    }

    // Get all components
    public getAllComponents(): Component[] {
        return Object.values(this.library.components);
    }

    // Clear the entire library
    public clearLibrary(
        saveCallback?: (library: ComponentLibrary) => void
    ): void {
        this.library = {
            components: {},
            lastModified: new Date()
        };

        if (saveCallback) {
            saveCallback(this.library);
        }
    }

    // Helper method to create a diagram component from a component
    public createDiagramComponentFromComponent(
        componentId: string,
        position: string = "center",
        relativeToId: string | null = null
    ): DiagramComponent | null {
        const component = this.getComponent(componentId);
        if (!component) return null;

        return {
            id: uuidv4(),
            shape: componentId,
            source: "component",
            position,
            relativeToId,
            attached2DShapes: [],
            attachmentPoints: component.attachmentPoints
        };
    }

    // Get the entire library
    public getLibrary(): ComponentLibrary {
        return this.library;
    }
}

// Export the singleton instance
export const componentLibraryManager = ComponentLibraryManager.getInstance();

export default ComponentLibraryManager;
