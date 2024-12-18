import {
    DiagramComponent,
    Point,
    AttachmentPoint,
    Shape,
    SerializedDiagramComponent,
    GlobalAttachmentPoint,
    AttachmentPointMap,
    Component
} from "../Types";
import { toggleAttachmentPoints } from "./svgUtils";
import { v4 as uuidv4 } from "uuid";
import { componentLibraryManager } from "./componentLib";

declare global {
    interface Window {
        SVGElement: typeof SVGElement;
    }
}

export const isFirst3DShape = (
    diagramComponents: DiagramComponent[],
    id: string
): boolean => {
    return diagramComponents.length > 0 && diagramComponents[0].id === id;
};

export const getFirstCut3DShape = (
    diagramComponents: DiagramComponent[]
): DiagramComponent | null => {
    const cutComponents = diagramComponents.filter(
        (component) => component.cut
    );
    if (cutComponents.length > 0) {
        return cutComponents[0];
    }
    return null;
};

export const get3DShape = (
    diagramComponents: DiagramComponent[],
    selected3DShape: string | null
): DiagramComponent | null => {
    if (selected3DShape === null) {
        return null;
    }
    return (
        diagramComponents.find(
            (component) => component.id === selected3DShape
        ) || null
    );
};

const findDependentShapes = (
    components: DiagramComponent[],
    shapeId: string,
    dependentIds: Set<string> = new Set()
): { dependentIds: Set<string>; maxIndex: number } => {
    dependentIds.add(shapeId);
    let maxIndex = components.findIndex((c) => c.id === shapeId);

    components.forEach((component, index) => {
        if (component.relativeToId === shapeId) {
            const { maxIndex: childMaxIndex } = findDependentShapes(
                components,
                component.id,
                dependentIds
            );
            maxIndex = Math.max(maxIndex, index, childMaxIndex);
        }
    });

    return { dependentIds, maxIndex };
};

export const extractAttachmentPoints = (
    svgElement: SVGElement
): AttachmentPoint[] => {
    const attachmentPoints: AttachmentPoint[] = [];
    const circles = svgElement.querySelectorAll('circle[id^="attach-"]');

    circles.forEach((circle) => {
        const id = circle.getAttribute("id");
        const cx = circle.getAttribute("cx");
        const cy = circle.getAttribute("cy");

        if (id && cx && cy) {
            attachmentPoints.push({
                name: id,
                x: parseFloat(cx),
                y: parseFloat(cy)
            });
        }
    });

    return attachmentPoints;
};

export const extractParentAttachmentPoints = (
    svgElement: SVGElement
): AttachmentPoint[] => {
    const attachmentPoints: AttachmentPoint[] = [];
    const circles = svgElement.querySelectorAll('circle[id^="parent-attach-"]');

    circles.forEach((circle) => {
        const id = circle.getAttribute("id")?.replace("parent-", "");
        const cx = circle.getAttribute("cx");
        const cy = circle.getAttribute("cy");

        if (id && cx && cy) {
            attachmentPoints.push({
                name: id,
                x: parseFloat(cx),
                y: parseFloat(cy)
            });
        }
    });

    return attachmentPoints;
};

export const getAvailableAttachmentPoints = (
    diagramComponents: DiagramComponent[],
    selected3DShape: string | null
): string[] => {
    const selectedComponent = get3DShape(diagramComponents, selected3DShape);
    if (selectedComponent) {
        return updateAvailableAttachmentPoints(selectedComponent);
    }
    return [];
};

export const getAttachmentPoint = (
    component: DiagramComponent,
    pointName: string
): AttachmentPoint | null => {
    if (component && component.attachmentPoints) {
        const point = component.attachmentPoints.find(
            (p) => p.name === pointName
        );
        return point || null;
    }
    return null;
};

export const getMatchingAttachmentPoints = (
    component: DiagramComponent,
    pointPattern: string
): AttachmentPoint[] | null => {
    if (component && component.attachmentPoints) {
        return component.attachmentPoints.filter(
            (p) => p.name.match(pointPattern)
        );
    }
    return null;
};

export const calculateAbsolutePosition = (
    component: DiagramComponent,
    referenceComponent: DiagramComponent | null,
    canvasSize: { width: number; height: number },
    diagramComponents: DiagramComponent[]
): Point => {
    if (!referenceComponent) {
        return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
    }

    // If the reference component doesn't have an absolute position yet,
    // calculate it recursively
    if (!referenceComponent.absolutePosition) {
        const refOfRef =
            diagramComponents.find(
                (c) => c.id === referenceComponent.relativeToId
            ) || null;
        referenceComponent.absolutePosition = calculateAbsolutePosition(
            referenceComponent,
            refOfRef,
            canvasSize,
            diagramComponents
        );
    }

    const [positionType, attachmentPoint] = component.position.split("-");
    const refAttachPoint = getAttachmentPoint(
        referenceComponent,
        `attach-${component.position}`
    );
    const newPoint =
        positionType === "top"
            ? "bottom"
            : positionType === "front"
            ? attachmentPoint === "left"
                ? "back-right"
                : "back-left"
            : attachmentPoint === "left"
            ? "front-right"
            : "front-left";

    const newShapeAttachPoint = getAttachmentPoint(
        component,
        `attach-${newPoint}`
    );

    if (!refAttachPoint || !newShapeAttachPoint) {
        console.warn(
            `Attachment points not found for ${component.id} or ${referenceComponent.id}`
        );
        return referenceComponent.absolutePosition;
    }

    return {
        x:
            referenceComponent.absolutePosition.x +
            refAttachPoint.x -
            newShapeAttachPoint.x,
        y:
            referenceComponent.absolutePosition.y +
            refAttachPoint.y -
            newShapeAttachPoint.y
    };
};

export const deepCloneComponentWithDependents = (
    component: DiagramComponent,
    diagramComponents: DiagramComponent[]
): DiagramComponent[] => {
    const clonedComponents: DiagramComponent[] = [];
    const idMap = new Map<string, string>();

    const cloneComponent = (comp: DiagramComponent): DiagramComponent => {
        const newId = `shape-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        idMap.set(comp.id, newId);

        const clonedComponent: DiagramComponent = {
            ...comp,
            id: newId,
            relativeToId: comp.relativeToId
                ? idMap.get(comp.relativeToId) || comp.relativeToId
                : null,
            attached2DShapes: comp.attached2DShapes
                ? comp.attached2DShapes.map((shape) => ({ ...shape }))
                : [],
            attachmentPoints: comp.attachmentPoints
                ? comp.attachmentPoints.map((point) => ({ ...point }))
                : [],
            absolutePosition: comp.absolutePosition
                ? { ...comp.absolutePosition }
                : { x: 0, y: 0 }
        };

        clonedComponents.push(clonedComponent);

        // Find and clone dependent shapes
        const dependentShapes = diagramComponents.filter(
            (c) => c.relativeToId === comp.id
        );
        dependentShapes.forEach((depShape) => cloneComponent(depShape));

        return clonedComponent;
    };

    cloneComponent(component);

    return clonedComponents;
};

export const add3DShape = (
    diagramComponents: DiagramComponent[],
    svgLibrary: Shape[],
    shapeName: string,
    position: string,
    attachmentPoint: string | null,
    selected3DShape: string | null
): {
    updatedComponents: DiagramComponent[];
    newComponent: DiagramComponent | null;
} => {
    const newId = `shape-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

    if (diagramComponents.length === 0 || selected3DShape !== null) {
        const shape = svgLibrary.find((s) => s.name === shapeName);
        if (!shape) {
            console.error(`Shape ${shapeName} not found in library`);
            return { updatedComponents: diagramComponents, newComponent: null };
        }

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(
            shape.svgContent,
            "image/svg+xml"
        );
        const svgElement = svgDoc.documentElement;

        if (!(svgElement instanceof SVGElement)) {
            console.error("Failed to parse SVG content");
            return { updatedComponents: diagramComponents, newComponent: null };
        }

        if (attachmentPoint === "none") {
            attachmentPoint = null;
        }

        const newComponent: DiagramComponent = {
            id: newId,
            shape: shapeName,
            source: "shape",
            position: (attachmentPoint ||
                position) as DiagramComponent["position"],
            relativeToId:
                diagramComponents.length === 0 ? null : selected3DShape,
            attached2DShapes: [],
            attachmentPoints: [],
            absolutePosition: { x: 0, y: 0 },
            cut: false
        };

        let updatedComponents = diagramComponents;
        if (newComponent.relativeToId) {
            // if the relativeToId is set, then insert the component as the last child
            const { dependentIds, maxIndex } = findDependentShapes(
                diagramComponents,
                newComponent.relativeToId
            );
            updatedComponents = [
                ...diagramComponents.slice(0, maxIndex + 1),
                ...[newComponent],
                ...diagramComponents.slice(maxIndex + 1)
            ];
        } else {
            // insert at the end of diagramComponents
            updatedComponents = [...diagramComponents, newComponent];
        }

        return {
            updatedComponents,
            newComponent
        };
    } else {
        console.error("Please select a 3D shape before adding a new one.");
        return { updatedComponents: diagramComponents, newComponent: null };
    }
};

// function to add a component to the diagram components from component library instead of svgLibrary
export function addComponentToScene(
    diagramComponents: DiagramComponent[],
    componentId: string,
    position: string,
    attachmentPoint: string | null,
    selectedComponentId: string | null
): {
    newComponent: DiagramComponent | null;
    updatedComponents: DiagramComponent[];
} {
    // Get the component from the library
    const component = componentLibraryManager.getComponent(componentId);
    if (!component) {
        console.error(`Component ${componentId} not found in library`);
        return {
            newComponent: null,
            updatedComponents: diagramComponents
        };
    }

    if (attachmentPoint === "none") {
        attachmentPoint = null;
    }
    if (diagramComponents.length === 0) {
        selectedComponentId = null;
    }
    // Create a new diagram component entry
    const newComponent: DiagramComponent = {
        id: `shape-${uuidv4()}`,
        shape: componentId,
        source: "component",
        position: (attachmentPoint || position) as DiagramComponent["position"],
        relativeToId: selectedComponentId,
        attached2DShapes: [],
        absolutePosition: { x: 0, y: 0 },
        attachmentPoints: component.attachmentPoints
    };

    // Add to existing components
    const updatedComponents = [...diagramComponents, newComponent];

    return {
        newComponent,
        updatedComponents
    };
}

export const add2DShape = (
    diagramComponents: DiagramComponent[],
    selected3DShape: string | null,
    shapeName: string,
    attachTo: string,
    position?: string,
    attachmentPoint?: string | null
): DiagramComponent[] => {
    if (selected3DShape !== null) {
        return diagramComponents.map((component) => {
            if (component.id === selected3DShape) {
                return {
                    ...component,
                    attached2DShapes: [
                        ...component.attached2DShapes,
                        { 
                            name: shapeName, 
                            attachedTo: (position && attachmentPoint && position === attachTo && attachmentPoint!== 'none')? attachmentPoint : attachTo 
                        }
                    ]
                };
            }
            return component;
        });
    } else {
        console.error("Please select a 3D shape to attach this 2D shape to.");
        return diagramComponents;
    }
};

export const remove3DShape = (
    diagramComponents: DiagramComponent[],
    id: string
): DiagramComponent[] => {
    const { dependentIds, maxIndex } = findDependentShapes(
        diagramComponents,
        id
    );
    return diagramComponents.filter(
        (component) => !dependentIds.has(component.id)
    );
};

export const remove2DShape = (
    diagramComponents: DiagramComponent[],
    parentId: string,
    shapeIndex: number
): DiagramComponent[] => {
    return diagramComponents.map((component) => {
        if (component.id === parentId) {
            return {
                ...component,
                attached2DShapes: component.attached2DShapes.filter(
                    (_, i) => i !== shapeIndex
                )
            };
        }
        return component;
    });
};

export const cut3DShape = (
    diagramComponents: DiagramComponent[],
    id: string
): DiagramComponent[] => {
    if (isFirst3DShape(diagramComponents, id)) {
        // do not allow cut of first 3D shape
        return diagramComponents;
    }
    // cancel any previous cut objects
    let updatedComponents = cancelCut(diagramComponents, null);
    const { dependentIds } = findDependentShapes(updatedComponents, id);
    return updatedComponents.map((component) =>
        dependentIds.has(component.id) ? { ...component, cut: true } : component
    );
};

export const cancelCut = (
    diagramComponents: DiagramComponent[],
    id: string | null
): DiagramComponent[] => {
    if (!id) {
        const firstCut = getFirstCut3DShape(diagramComponents);
        if (firstCut) {
            id = firstCut.id;
        }
    }
    if (id) {
        const { dependentIds } = findDependentShapes(diagramComponents, id);
        return diagramComponents.map((component) =>
            dependentIds.has(component.id)
                ? { ...component, cut: false }
                : component
        );
    }
    return diagramComponents;
};

export const copy3DShape = (
    diagramComponents: DiagramComponent[],
    id: string | null
): DiagramComponent[] => {
    if (!id) {
        const firstCut = getFirstCut3DShape(diagramComponents);
        if (firstCut) {
            id = firstCut.id;
        } else {
            // no cut objects
            return diagramComponents;
        }
    }
    // cancel any previous cut objects
    //let updatedComponents = cancelCut(diagramComponents, null);
    let updatedComponents = diagramComponents;
    const componentToCopy = updatedComponents.find(
        (component) => component.id === id
    );
    if (!componentToCopy) {
        console.error(`Component with id ${id} not found`);
        return [];
    }
    return deepCloneComponentWithDependents(componentToCopy, updatedComponents);
};

export const pasteCut3DShapes = (
    diagramComponents: DiagramComponent[],
    id: string | null,
    targetId: string,
    newPosition: DiagramComponent["position"],
    attachmentPoint: string | null
): {
    updatedComponents: DiagramComponent[];
    pastedComponent: DiagramComponent | null;
} => {
    // if no id was specified, get the first cut object
    if (!id) {
        const firstCut = getFirstCut3DShape(diagramComponents);
        if (firstCut) {
            id = firstCut.id;
        } else {
            return {
                updatedComponents: diagramComponents,
                pastedComponent: null
            };
        }
    }

    const { dependentIds } = findDependentShapes(diagramComponents, id);
    let pastedComponent: DiagramComponent | null = null;
    let cutComponents: DiagramComponent[] = [];
    let nonCutComponents: DiagramComponent[] = [];

    if (attachmentPoint === "none") {
        attachmentPoint = null;
    }

    // Separate cut and non-cut components
    diagramComponents.forEach((component) => {
        if (dependentIds.has(component.id)) {
            cutComponents.push({ ...component, cut: false });
        } else {
            nonCutComponents.push(component);
        }
    });

    return pasteCopied3DShapes(
        nonCutComponents,
        cutComponents,
        targetId,
        newPosition,
        attachmentPoint
    );
};

export const pasteCopied3DShapes = (
    diagramComponents: DiagramComponent[],
    copiedComponents: DiagramComponent[],
    targetId: string,
    position: string,
    attachmentPoint: string | null
): {
    updatedComponents: DiagramComponent[];
    pastedComponent: DiagramComponent | null;
} => {
    if (copiedComponents.length === 0) {
        return { updatedComponents: diagramComponents, pastedComponent: null };
    }

    if (attachmentPoint === "none") {
        attachmentPoint = null;
    }

    let componentsToPaste = copiedComponents;

    // check if the first copied component has an id that already exists in diagramComponents,
    // then we are pasting the copied elements, not cut elements. So clone them before pasting.
    const componentExists = get3DShape(
        diagramComponents,
        copiedComponents[0].id
    );
    if (componentExists) {
        // create a new copy
        componentsToPaste = copy3DShape(
            copiedComponents,
            copiedComponents[0].id
        );
    }
    const pastedComponents: DiagramComponent[] = componentsToPaste.map(
        (component, index) => {
            if (index === 0) {
                // Only update the first component's relativeToId and position
                return {
                    ...component,
                    relativeToId: targetId,
                    position: (attachmentPoint ||
                        position) as DiagramComponent["position"]
                };
            } else {
                // Keep other components unchanged
                return { ...component };
            }
        }
    );

    // Find all dependent objects of the target, so we can insert the pasted components at the end
    const { dependentIds, maxIndex } = findDependentShapes(
        diagramComponents,
        targetId
    );

    // Insert cut components after the last dependent of the target
    const updatedComponents = [
        ...diagramComponents.slice(0, maxIndex + 1),
        ...pastedComponents,
        ...diagramComponents.slice(maxIndex + 1)
    ];

    return {
        updatedComponents,
        pastedComponent: pastedComponents[0]
    };
};

export const getSvgFromLibrary = (
    shapeName: string,
    svgLibrary: Shape[]
): SVGGElement | null => {
    const shape = svgLibrary.find((s) => s.name === shapeName);
    if (!shape) {
        console.warn(`Shape ${shapeName} not found in library`);
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(shape.svgContent, "image/svg+xml");
    const svgElement = doc.documentElement;

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    while (svgElement.firstChild) {
        group.appendChild(svgElement.firstChild);
    }

    return group;
};

// Function to ensure all component IDs start with 'shape-'
const standardizeComponentIds = (
    components: DiagramComponent[]
): DiagramComponent[] => {
    // Map old IDs to new IDs
    const idMap = new Map<string, string>();

    // First pass: create mapping of old to new IDs
    components.forEach((component) => {
        if (!component.id.startsWith("shape-")) {
            const newId = `shape-${component.id}`;
            idMap.set(component.id, newId);
        }
    });

    // Second pass: update all components with new IDs and references
    return components.map((component) => {
        // If this component needs a new ID
        const newId = idMap.get(component.id) || component.id;

        // Update relativeToId if it exists and needs updating
        let newRelativeToId = component.relativeToId;
        if (component.relativeToId && idMap.has(component.relativeToId)) {
            newRelativeToId =
                idMap.get(component.relativeToId) || component.relativeToId;
        }

        return {
            ...component,
            id: newId,
            relativeToId: newRelativeToId
        };
    });
};

// Define valid position prefixes
type PositionPrefix = "top" | "front-left" | "front-right";

// Helper function to extract position parts (prefix and suffix)
const parsePosition = (
    position: string
): { prefix: string; suffix: string | null } => {
    // Match basic position (top, front-left, front-right) and optional suffix
    const match = position.match(/^(top|front-left|front-right)(?:-(.+))?$/);
    if (!match) {
        return { prefix: position, suffix: null };
    }
    return {
        prefix: match[1],
        suffix: match[2] || null
    };
};

// Helper function to check if string is a valid PositionPrefix
const isValidPositionPrefix = (prefix: string): prefix is PositionPrefix => {
    return ["top", "front-left", "front-right"].includes(prefix);
};

// Helper function to compare two components by their position
const comparePositions = (pos1: string, pos2: string): number => {
    const { prefix: prefix1, suffix: suffix1 } = parsePosition(pos1);
    const { prefix: prefix2, suffix: suffix2 } = parsePosition(pos2);

    // First compare prefixes
    if (prefix1 !== prefix2) {
        // Define custom order for prefixes with explicit typing
        const prefixOrder: Record<PositionPrefix, number> = {
            top: 0,
            "front-left": 1,
            "front-right": 2
        };

        // Get order values with type safety
        const order1 = isValidPositionPrefix(prefix1)
            ? prefixOrder[prefix1]
            : 999;
        const order2 = isValidPositionPrefix(prefix2)
            ? prefixOrder[prefix2]
            : 999;

        return order1 - order2;
    }

    // If prefixes are the same and both have suffixes, compare suffixes
    if (suffix1 && suffix2) {
        // Try numeric comparison first
        const num1 = parseInt(suffix1);
        const num2 = parseInt(suffix2);
        if (!isNaN(num1) && !isNaN(num2)) {
            return num1 - num2;
        }
        // Fall back to string comparison
        return suffix1.localeCompare(suffix2);
    }

    // If only one has a suffix, the one without comes first
    if (suffix1) return 1;
    if (suffix2) return -1;

    // If neither has a suffix, they're equal
    return 0;
};

// Main reordering function
const reorderComponents = (
    components: DiagramComponent[]
): DiagramComponent[] => {
    // First, group components by their relativeToId
    const groupedComponents = new Map<string | null, DiagramComponent[]>();

    // Initialize with null group (root components)
    groupedComponents.set(null, []);

    // Group components
    components.forEach((component) => {
        const relativeId = component.relativeToId;
        if (!groupedComponents.has(relativeId)) {
            groupedComponents.set(relativeId, []);
        }
        groupedComponents.get(relativeId)!.push(component);
    });

    // Sort each group by position
    groupedComponents.forEach((group) => {
        group.sort((a, b) => comparePositions(a.position, b.position));
    });

    // Function to recursively build ordered list
    const buildOrderedList = (
        relativeId: string | null,
        result: DiagramComponent[]
    ) => {
        const group = groupedComponents.get(relativeId) || [];

        // Add all components in this group
        group.forEach((component) => {
            result.push(component);
            // Recursively add any components that are relative to this one
            buildOrderedList(component.id, result);
        });
    };

    // Build final ordered list starting from root components
    const orderedComponents: DiagramComponent[] = [];
    buildOrderedList(null, orderedComponents);

    return orderedComponents;
};

export const areComponentsEqual = (
    comp1: DiagramComponent,
    comp2: DiagramComponent
): boolean => {
    return (
        comp1.id === comp2.id &&
        comp1.shape === comp2.shape &&
        comp1.position === comp2.position &&
        comp1.relativeToId === comp2.relativeToId &&
        comp1.cut === comp2.cut &&
        comp1.type === comp2.type &&
        JSON.stringify(comp1.metadata) === JSON.stringify(comp2.metadata) &&
        JSON.stringify(comp1.attached2DShapes) ===
            JSON.stringify(comp2.attached2DShapes) &&
        JSON.stringify(comp1.absolutePosition) ===
            JSON.stringify(comp2.absolutePosition) &&
        JSON.stringify(comp1.attachmentPoints) ===
            JSON.stringify(comp2.attachmentPoints)
    );
};

export const areComponentArraysEqual = (
    arr1: DiagramComponent[],
    arr2: DiagramComponent[]
): boolean => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((comp, index) => areComponentsEqual(comp, arr2[index]));
};

// render a diagramComponent by checking if it is a 3D shape or component
const renderComponent = (
    component: DiagramComponent,
    canvasSize: { width: number; height: number },
    svgLibrary: Shape[],
    showAttachmentPoints: boolean
): {
    shape3DElement: SVGGElement;
    attachmentPoints: AttachmentPoint[];
    parentAttachmentPoints: AttachmentPoint[];
} | null => {
    function createSvgGroup(svgContent: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, "image/svg+xml");
        const svgElement = doc.documentElement;

        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        while (svgElement.firstChild) {
            group.appendChild(svgElement.firstChild);
        }
        group.setAttribute("id", component.id);
        return group;
    }

    let shape3DElement = null;
    let attachmentPoints: AttachmentPoint[] = [];
    let parentAttachmentPoints: AttachmentPoint[] = [];

    if (component.source === "component") {
        // Get component from library
        const componentData = componentLibraryManager.getComponent(
            component.shape
        );
        if (!componentData) {
            console.error(`Component ${component.shape} not found in library`);
            return null;
        }
        const svgContent =
            componentData.svgContent ||
            componentLibraryManager.renderComponent(
                componentData.id,
                canvasSize,
                svgLibrary
            );
        shape3DElement = createSvgGroup(svgContent);
        attachmentPoints = componentData.attachmentPoints;
    } else {
        const shape = svgLibrary.find((s) => s.name === component.shape);
        if (!shape) {
            console.warn(`Shape ${component.shape} not found in library`);
            return null;
        }
        shape3DElement = createSvgGroup(shape.svgContent);
        attachmentPoints = extractAttachmentPoints(shape3DElement);
        parentAttachmentPoints = extractParentAttachmentPoints(shape3DElement);
    }

    return {
        shape3DElement,
        attachmentPoints,
        parentAttachmentPoints
    };
};

export const compileDiagram = (
    diagramComponents: DiagramComponent[],
    canvasSize: { width: number; height: number },
    svgLibrary: Shape[],
    showAttachmentPoints: boolean
): { svgContent: string; processedComponents: DiagramComponent[] } => {

    // Standardize component IDs before processing
    const standardizedComponents = standardizeComponentIds(diagramComponents);

    // Then reorder components
    const orderedComponents = reorderComponents(standardizedComponents);

    let svgContent = "";
    const processedComponents: DiagramComponent[] = [];

    orderedComponents.forEach((component) => {
        const renderedComponent = renderComponent(
            component,
            canvasSize,
            svgLibrary,
            showAttachmentPoints
        );
        if (!renderedComponent) {
            processedComponents.push(component);
            return;
        }

        const { shape3DElement, attachmentPoints, parentAttachmentPoints } =
            renderedComponent;

        component.attachmentPoints = attachmentPoints;
        component.parentAttachmentPoints = parentAttachmentPoints;

        const referenceComponent = component.relativeToId
            ? processedComponents.find(
                  (c) => c.id === component.relativeToId
              ) || null
            : null;

        const absolutePosition = calculateAbsolutePosition(
            component,
            referenceComponent,
            canvasSize,
            diagramComponents
        );
        component.absolutePosition = absolutePosition;

        shape3DElement.setAttribute(
            "transform",
            `translate(${absolutePosition.x}, ${absolutePosition.y})`
        );

        // Attach 2D shapes
        component.attached2DShapes.forEach((attached2DShape) => {
            const shape2DElement = getSvgFromLibrary(
                attached2DShape.name,
                svgLibrary
            );
            if (shape2DElement) {
                shape2DElement.setAttribute(
                    "id",
                    `${attached2DShape.attachedTo}-${attached2DShape.name}`
                );
                const attach2DPoints = extractAttachmentPoints(shape2DElement);
                const attach3DPoint = getAttachmentPoint(
                    component,
                    `attach-${attached2DShape.attachedTo}`
                );
                if (attach2DPoints.length > 0 && attach3DPoint) {
                    const dx = attach3DPoint.x - attach2DPoints[0].x;
                    const dy = attach3DPoint.y - attach2DPoints[0].y;
                    const transform = `translate(${dx}, ${dy})`;
                    shape2DElement.setAttribute("transform", transform);
                    shape3DElement.appendChild(shape2DElement);
                } else {
                    console.warn(
                        `Attachment points not found for 2D shape ${attached2DShape.name} or 3D shape ${component.shape}`
                    );
                }
            }
        });

        // toggle visibility of attachment points
        toggleAttachmentPoints(shape3DElement, showAttachmentPoints);

        svgContent += shape3DElement.outerHTML;
        processedComponents.push(component);
    });

    return { svgContent, processedComponents };
};

export const updateAvailableAttachmentPoints = (
    shape: DiagramComponent | null | undefined
): string[] => {
    if (
        !shape ||
        !shape.attachmentPoints ||
        !Array.isArray(shape.attachmentPoints)
    ) {
        return ["none"];
    }

    const points = shape.attachmentPoints
        .filter((point) => point.name.startsWith("attach-"))
        .map((point) => {
            const parts = point.name.split("-");
            return parts.length > 2 ? `${parts[1]}-${parts[2]}` : parts[1];
        });

    return ["none", ...new Set(points)];
};

export const calculateDistance = (point1: Point, point2: Point): number => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
};

export const findClosestAttachmentPoint = (
    clickPoint: Point,
    component: DiagramComponent
): { position: string; attachmentPoint: string } => {
    if (
        !Array.isArray(component.attachmentPoints) ||
        component.attachmentPoints.length < 1
    ) {
        return { position: "top", attachmentPoint: "none" };
    }

    // Filter out attachment points starting with "attach-bottom" and "attach-back"
    const validAttachmentPoints = component.attachmentPoints.filter(
        (point) =>
            !point.name.startsWith("attach-bottom") &&
            !point.name.startsWith("attach-back")
    );

    if (validAttachmentPoints.length === 0) {
        return { position: "top", attachmentPoint: "none" };
    }

    let closestPoint: AttachmentPoint = validAttachmentPoints[0];
    let minDistance = Infinity;

    validAttachmentPoints.forEach((point: AttachmentPoint) => {
        if (typeof point.x === "number" && typeof point.y === "number") {
            const distance = calculateDistance(clickPoint, point);

            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        }
    });

    if (typeof closestPoint.name !== "string") {
        return { position: "top", attachmentPoint: "none" };
    }

    const nameParts = closestPoint.name.split("-");
    if (nameParts.length < 2 || nameParts[0] !== "attach") {
        return { position: "top", attachmentPoint: "none" };
    }

    let position: string;
    let specific: string;

    if (
        nameParts[1] === "front" &&
        (nameParts[2] === "left" || nameParts[2] === "right")
    ) {
        position = `${nameParts[1]}-${nameParts[2]}`;
        specific = nameParts.slice(3).join("-");
    } else {
        position = nameParts[1];
        specific = nameParts.slice(2).join("-");
    }

    return {
        position: position,
        attachmentPoint: specific ? `${position}-${specific}` : "none"
    };
};

export const getClosestAttachmentPoint = (
    clickX: number,
    clickY: number,
    component: DiagramComponent
): { position: string; attachmentPoint: string } => {
    const clickPoint: Point = { x: clickX, y: clickY };
    return findClosestAttachmentPoint(clickPoint, component);
};

// Functions for attachment points at a global level across all diagram

export const extractGlobalAttachmentPoints = (
    diagramComponents: DiagramComponent[]
): GlobalAttachmentPoint[] => {
    const globalPoints: GlobalAttachmentPoint[] = [];
    for (const component of diagramComponents) {
        // Skip if component has no absolute position (shouldn't happen after compilation)
        if (!component.absolutePosition) {
            console.warn(`Component ${component.id} has no absolute position`);
            continue;
        }

        if (
            component.attachmentPoints !== undefined &&
            component.attachmentPoints.length > 0
        ) {
            const componentPoints = component.attachmentPoints.map((point) => {
                // Convert the relative point coordinates to global coordinates by adding
                // the component's absolute position
                return component.absolutePosition !== undefined
                    ? {
                          ...point,
                          x: point.x + component.absolutePosition.x,
                          y: point.y + component.absolutePosition.y
                      }
                    : point;
            });

            globalPoints.push(<GlobalAttachmentPoint>{
                componentId: component.id,
                attachmentPoints: componentPoints
            });
        }
    }

    return globalPoints;
};

// Helper function to get a specific component's attachment points' global coordinates
const getSpecifiedGlobalAttachmentPoints = (
    component: DiagramComponent,
    attachType: "attachmentPoints" | "parentAttachmentPoints"
): AttachmentPointMap => {
    if (!component || component.absolutePosition === undefined) {
        return {};
    }

    const globalPoints: AttachmentPointMap = {};
    const attachPoints = component[attachType];

    attachPoints?.forEach((point) => {
        if (component.absolutePosition) {
            globalPoints[point.name] = {
                name: point.name,
                x: component.absolutePosition.x + point.x,
                y: component.absolutePosition.y + point.y
            };
        }
    });

    return globalPoints;
};

export const getGlobalAttachmentPoints = (
    component: DiagramComponent
): AttachmentPointMap => {
    if (!component || component.absolutePosition === undefined) {
        return {};
    }

    return getSpecifiedGlobalAttachmentPoints(component, "attachmentPoints");
};

export const getGlobalParentAttachmentPoints = (
    component: DiagramComponent
): AttachmentPointMap => {
    if (!component || component.absolutePosition === undefined) {
        return {};
    }

    return getSpecifiedGlobalAttachmentPoints(
        component,
        "parentAttachmentPoints"
    );
};

// Helper function to find the closest attachment point to a given coordinate
export const findClosestGlobalAttachmentPoint = (
    diagramComponents: DiagramComponent[],
    x: number,
    y: number,
    filter?: (pointName: string) => boolean
): {
    componentId: string;
    pointName: string;
    x: number;
    y: number;
    distance: number;
} | null => {
    let closestPoint = null;
    let minDistance = Infinity;

    const allPoints = extractGlobalAttachmentPoints(diagramComponents);

    for (const component of allPoints) {
        for (const point of component.attachmentPoints) {
            // Apply filter if provided
            if (filter && !filter(point.name)) {
                continue;
            }

            const dx = x - point.x;
            const dy = y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = {
                    componentId: component.componentId,
                    pointName: point.name,
                    x: point.x,
                    y: point.y,
                    distance
                };
            }
        }
    }

    return closestPoint;
};

// Find all components that have no other components placed on top of them
export const findTopMostComponents = (
    components: DiagramComponent[],
    side: string = 'top'
): DiagramComponent[] => {
    return components.filter((component) => {
        return !components.some(
            (other) =>
                other.relativeToId === component.id &&
                other.position === side
        );
    });
};

// Find all components that are not placed on top of any other components
export const findBottomMostComponents = (
    components: DiagramComponent[],
    side: string = 'top'
): DiagramComponent[] => {
    return components.filter((component) => {
        return (
            component.relativeToId === null ||
            component.position !== side
        );
    });
};


export const getExtremeAttachmentPoints = (
    components: DiagramComponent[]
): { topPoints: AttachmentPoint[]; bottomPoints: AttachmentPoint[] } => {
    const topMostComponents = findTopMostComponents(components);
    const bottomMostComponents = findBottomMostComponents(components);
    console.log(
        "components:",
        components,
        "topmost:",
        topMostComponents,
        "bottommost:",
        bottomMostComponents
    );

    const topPoints: AttachmentPoint[] = [];
    const bottomPoints: AttachmentPoint[] = [];

    // Extract top attachment points from topmost components
    topMostComponents.forEach(component => {
        if (component.attachmentPoints) {
            const topAttachPoints = component.attachmentPoints.filter(point => 
                point.name.startsWith('attach-top')
            );
            if (component.absolutePosition) {
                topAttachPoints.forEach(point => {
                    topPoints.push({
                        ...point,
                        x: point.x + component.absolutePosition!.x,
                        y: point.y + component.absolutePosition!.y
                    });
                });
            }
        }
    });

    // Extract bottom attachment points from bottommost components
    bottomMostComponents.forEach(component => {
        if (component.attachmentPoints) {
            const bottomAttachPoints = component.attachmentPoints.filter(point =>
                point.name.startsWith('attach-bottom')
            );
            if (component.absolutePosition) {
                bottomAttachPoints.forEach(point => {
                    bottomPoints.push({
                        ...point,
                        x: point.x + component.absolutePosition!.x,
                        y: point.y + component.absolutePosition!.y
                    });
                });
            }
        }
    });

    return { topPoints, bottomPoints };
};

export const serializeDiagramComponents = (
    diagramComponents: DiagramComponent[],
    addAttachmentPoints: boolean = false
): SerializedDiagramComponent[] => {
    // Map each component to only include the necessary attributes
    return diagramComponents.map((component) => {
        const serializedComponent: SerializedDiagramComponent = {
            id: component.id,
            shape: component.shape,
            position: component.position,
            source: component.source,
            relativeToId: component.relativeToId,
            attached2DShapes: component.attached2DShapes,
            type: component.type, // Include type
            metadata: component.metadata, // Include metadata
            attachmentPoints: addAttachmentPoints
                ? component.attachmentPoints || []
                : []
        };
        return serializedComponent;
    });
};
export const deserializeDiagramComponents = (
    serializedData: SerializedDiagramComponent[]
): DiagramComponent[] => {
    if (!validateLoadedFile(serializedData)) {
        throw new Error("Invalid diagram components structure");
    }

    // Reconstruct the full DiagramComponent structure
    return serializedData.map((component: SerializedDiagramComponent) => ({
        ...component,
        attachmentPoints: [], // Will be computed by compileDiagram
        absolutePosition: { x: 0, y: 0 }, // Will be computed by compileDiagram
        cut: false, // Reset cut state on load
        type: component.type, // Preserve type
        metadata: component.metadata // Preserve metadata
    }));
};

// Update validation function to check metadata attributes
export const validateLoadedFile = (data: any): boolean => {
    if (!Array.isArray(data)) return false;

    // Check if components have the required structure
    for (const component of data) {
        if (!component.id || !component.shape || !component.position)
            return false;
        if (!Array.isArray(component.attached2DShapes)) return false;

        // Validate attached2DShapes
        for (const shape of component.attached2DShapes) {
            if (
                typeof shape.name !== "string" ||
                typeof shape.attachedTo !== "string"
            )
                return false;
        }

        // Validate optional metadata fields
        if (component.type !== undefined && typeof component.type !== "string")
            return false;
        if (
            component.metadata !== undefined &&
            typeof component.metadata !== "object"
        )
            return false;
    }

    return true;
};
