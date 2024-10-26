import { DiagramComponent, Point, AttachmentPoint, Shape, SerializedDiagramComponent } from '../Types';
import { toggleAttachmentPoints } from './svgUtils';

declare global {
    interface Window {
        SVGElement: typeof SVGElement;
    }
}

export const isFirst3DShape = (
    diagramComponents: DiagramComponent[],
    id: string
): boolean => {
    return (diagramComponents.length > 0 && diagramComponents[0].id === id);
}

export const getFirstCut3DShape = (
    diagramComponents: DiagramComponent[]
): DiagramComponent | null => {
    const cutComponents = diagramComponents.filter(component => component.cut);
    if (cutComponents.length > 0) {
        return cutComponents[0];
    }
    return null;
}

export const get3DShape = (
    diagramComponents: DiagramComponent[],
    selected3DShape: string | null
): DiagramComponent | null => {
    if (selected3DShape === null) {
        return null;
    }
    return diagramComponents.find(component => component.id === selected3DShape) || null;
};

const findDependentShapes = (
    components: DiagramComponent[],
    shapeId: string,
    dependentIds: Set<string> = new Set()
): { dependentIds: Set<string>; maxIndex: number } => {
    dependentIds.add(shapeId);
    let maxIndex = components.findIndex(c => c.id === shapeId);

    components.forEach((component, index) => {
        if (component.relativeToId === shapeId) {
            const { maxIndex: childMaxIndex } = findDependentShapes(components, component.id, dependentIds);
            maxIndex = Math.max(maxIndex, index, childMaxIndex);
        }
    });

    return { dependentIds, maxIndex };
};

export const extractAttachmentPoints = (svgElement: SVGElement): AttachmentPoint[] => {
    const attachmentPoints: AttachmentPoint[] = [];
    const circles = svgElement.querySelectorAll('circle[id^="attach-"]');

    circles.forEach((circle) => {
        const id = circle.getAttribute('id');
        const cx = circle.getAttribute('cx');
        const cy = circle.getAttribute('cy');

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

export const getAttachmentPoint = (component: DiagramComponent, pointName: string): Point | null => {
    const point = component.attachmentPoints.find(p => p.name === pointName);
    return point ? { x: point.x, y: point.y } : null;
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
        const refOfRef = diagramComponents.find(c => c.id === referenceComponent.relativeToId) || null;
        referenceComponent.absolutePosition = calculateAbsolutePosition(
            referenceComponent,
            refOfRef,
            canvasSize,
            diagramComponents
        );
    }

    const [positionType, attachmentPoint] = component.position.split('-');
    const refAttachPoint = getAttachmentPoint(referenceComponent, `attach-${component.position}`);
    const newPoint = (
        positionType === 'top' ? 'bottom' : (
            positionType === 'front' ? (
                attachmentPoint === 'left' ? 'back-right' : 'back-left'
            ) : (
                attachmentPoint === 'left' ? 'front-right' : 'front-left'
            )
        )
    );

    const newShapeAttachPoint = getAttachmentPoint(component, `attach-${newPoint}`);

    if (!refAttachPoint || !newShapeAttachPoint) {
        console.warn(`Attachment points not found for ${component.id} or ${referenceComponent.id}`);
        return referenceComponent.absolutePosition;
    }

    return {
        x: referenceComponent.absolutePosition.x + refAttachPoint.x - newShapeAttachPoint.x,
        y: referenceComponent.absolutePosition.y + refAttachPoint.y - newShapeAttachPoint.y
    };
};

export const deepCloneComponentWithDependents = (
    component: DiagramComponent,
    diagramComponents: DiagramComponent[]
): DiagramComponent[] => {
    const clonedComponents: DiagramComponent[] = [];
    const idMap = new Map<string, string>();

    const cloneComponent = (comp: DiagramComponent): DiagramComponent => {
        const newId = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        idMap.set(comp.id, newId);

        const clonedComponent: DiagramComponent = {
            ...comp,
            id: newId,
            relativeToId: comp.relativeToId ? idMap.get(comp.relativeToId) || comp.relativeToId : null,
            attached2DShapes: comp.attached2DShapes.map(shape => ({ ...shape })),
            attachmentPoints: comp.attachmentPoints.map(point => ({ ...point })),
            absolutePosition: { ...comp.absolutePosition },
        };

        clonedComponents.push(clonedComponent);

        // Find and clone dependent shapes
        const dependentShapes = diagramComponents.filter(c => c.relativeToId === comp.id);
        dependentShapes.forEach(depShape => cloneComponent(depShape));

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
): { updatedComponents: DiagramComponent[], newComponent: DiagramComponent | null } => {
    const newId = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (diagramComponents.length === 0 || selected3DShape !== null) {
        const shape = svgLibrary.find(s => s.name === shapeName);
        if (!shape) {
            console.error(`Shape ${shapeName} not found in library`);
            return { updatedComponents: diagramComponents, newComponent: null };
        }

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(shape.svgContent, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        if (!(svgElement instanceof SVGElement)) {
            console.error('Failed to parse SVG content');
            return { updatedComponents: diagramComponents, newComponent: null };
        }

        //const attachmentPoints = extractAttachmentPoints(svgElement);

        if (attachmentPoint === 'none') {
            attachmentPoint = null;
        }

        const newComponent: DiagramComponent = {
            id: newId,
            shape: shapeName,
            position: (attachmentPoint || position) as DiagramComponent['position'],
            relativeToId: diagramComponents.length === 0 ? null : selected3DShape,
            attached2DShapes: [],
            attachmentPoints: [],
            absolutePosition: { x: 0, y: 0 },
            cut: false,
        };

        let updatedComponents = diagramComponents;
        if (newComponent.relativeToId) {
            // if the relativeToId is set, then insert the component as the last child
            const { dependentIds, maxIndex } = findDependentShapes(diagramComponents, newComponent.relativeToId);
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
        console.error('Please select a 3D shape before adding a new one.');
        return { updatedComponents: diagramComponents, newComponent: null };
    }
};

export const add2DShape = (
    diagramComponents: DiagramComponent[],
    selected3DShape: string | null,
    shapeName: string,
    attachTo: string
): DiagramComponent[] => {
    if (selected3DShape !== null) {
        return diagramComponents.map(component => {
            if (component.id === selected3DShape) {
                return {
                    ...component,
                    attached2DShapes: [...component.attached2DShapes, { name: shapeName, attachedTo: attachTo }]
                };
            }
            return component;
        });
    } else {
        console.error('Please select a 3D shape to attach this 2D shape to.');
        return diagramComponents;
    }
};

export const remove3DShape = (
    diagramComponents: DiagramComponent[],
    id: string
): DiagramComponent[] => {
    console.log(`App: remove 3D shape ${id}`);
    const { dependentIds, maxIndex } = findDependentShapes(diagramComponents, id);
    return diagramComponents.filter(component => !dependentIds.has(component.id));
};

export const remove2DShape = (
    diagramComponents: DiagramComponent[],
    parentId: string,
    shapeIndex: number
): DiagramComponent[] => {
    return diagramComponents.map(component => {
        if (component.id === parentId) {
            return {
                ...component,
                attached2DShapes: component.attached2DShapes.filter((_, i) => i !== shapeIndex)
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
    return updatedComponents.map(component =>
        dependentIds.has(component.id)
            ? { ...component, cut: true }
            : component
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
        return diagramComponents.map(component =>
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
            id = firstCut.id
        } else { // no cut objects
            return diagramComponents;
        }
    }
    // cancel any previous cut objects
    //let updatedComponents = cancelCut(diagramComponents, null);
    let updatedComponents = diagramComponents;
    const componentToCopy = updatedComponents.find(component => component.id === id);
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
    newPosition: DiagramComponent['position'],
    attachmentPoint: string | null,
): { updatedComponents: DiagramComponent[], pastedComponent: DiagramComponent | null } => {

    // if no id was specified, get the first cut object
    if (!id) {
        const firstCut = getFirstCut3DShape(diagramComponents);
        if (firstCut) {
            id = firstCut.id;
        } else {
            return {
                updatedComponents: diagramComponents,
                pastedComponent: null
            }
        }
    }

    const { dependentIds } = findDependentShapes(diagramComponents, id);
    let pastedComponent: DiagramComponent | null = null;
    let cutComponents: DiagramComponent[] = [];
    let nonCutComponents: DiagramComponent[] = [];

    console.log(`pasting object ${id} on ${targetId} at ${newPosition} ${attachmentPoint}`);

    if (attachmentPoint === 'none') {
        attachmentPoint = null;
    }

    // Separate cut and non-cut components
    diagramComponents.forEach(component => {
        if (dependentIds.has(component.id)) {
            cutComponents.push({ ...component, cut: false });
        } else {
            nonCutComponents.push(component);
        }
    });

    return pasteCopied3DShapes(nonCutComponents, cutComponents, targetId, newPosition, attachmentPoint);

};

export const pasteCopied3DShapes = (
    diagramComponents: DiagramComponent[],
    copiedComponents: DiagramComponent[],
    targetId: string,
    position: string,
    attachmentPoint: string | null
): { updatedComponents: DiagramComponent[], pastedComponent: DiagramComponent | null } => {
    if (copiedComponents.length === 0) {
        return { updatedComponents: diagramComponents, pastedComponent: null };
    }

    if (attachmentPoint === 'none') {
        attachmentPoint = null;
    }

    let componentsToPaste = copiedComponents;

    // check if the first copied component has an id that already exists in diagramComponents,
    // then we are pasting the copied elements, not cut elements. So clone them before pasting.
    const componentExists = get3DShape(diagramComponents, copiedComponents[0].id);
    if (componentExists) {
        // create a new copy
        console.log('component copy already pasted... re-copying');
        componentsToPaste = copy3DShape(copiedComponents, copiedComponents[0].id);
    }
    const pastedComponents: DiagramComponent[] = componentsToPaste.map((component, index) => {
        if (index === 0) {
            // Only update the first component's relativeToId and position
            return {
                ...component,
                relativeToId: targetId,
                position: (attachmentPoint || position) as DiagramComponent['position'],
            };
        } else {
            // Keep other components unchanged
            return { ...component };
        }
    });

    // Find all dependent objects of the target, so we can insert the pasted components at the end
    const { dependentIds, maxIndex } = findDependentShapes(diagramComponents, targetId);

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

export const getSvgFromLibrary = (shapeName: string, svgLibrary: Shape[]): SVGGElement | null => {
    const shape = svgLibrary.find(s => s.name === shapeName);
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

export const compileDiagram = (
    diagramComponents: DiagramComponent[],
    canvasSize: { width: number; height: number },
    svgLibrary: Shape[],
    showAttachmentPoints: boolean
): { svgContent: string; processedComponents: DiagramComponent[] } => {
    console.log('Compiling diagram...', diagramComponents);

    let svgContent = '';
    const processedComponents: DiagramComponent[] = [];

    diagramComponents.forEach((component) => {
        const shape3DElement = getSvgFromLibrary(component.shape, svgLibrary);
        if (!shape3DElement) {
            console.warn(`3D shape not found in library:`, component.shape);
            processedComponents.push(component);
            return;
        }

        shape3DElement.setAttribute('id', component.id);

        const attachmentPoints = extractAttachmentPoints(shape3DElement);
        component.attachmentPoints = attachmentPoints;

        const referenceComponent = component.relativeToId
            ? processedComponents.find(c => c.id === component.relativeToId) || null
            : null;

        const absolutePosition = calculateAbsolutePosition(component, referenceComponent, canvasSize, diagramComponents);
        component.absolutePosition = absolutePosition;

        shape3DElement.setAttribute('transform', `translate(${absolutePosition.x}, ${absolutePosition.y})`);

        // Attach 2D shapes
        component.attached2DShapes.forEach((attached2DShape) => {
            const shape2DElement = getSvgFromLibrary(attached2DShape.name, svgLibrary);
            if (shape2DElement) {
                shape2DElement.setAttribute("id", `${attached2DShape.attachedTo}-${attached2DShape.name}`);

                const shape2DAttachPoint = shape2DElement.querySelector('#attach-point');
                const shape3DAttachPoint = shape3DElement.querySelector(`#attach-${attached2DShape.attachedTo}`);

                if (shape2DAttachPoint && shape3DAttachPoint) {
                    const dx = parseFloat(shape3DAttachPoint.getAttribute("cx") || "0") - parseFloat(shape2DAttachPoint.getAttribute("cx") || "0");
                    const dy = parseFloat(shape3DAttachPoint.getAttribute("cy") || "0") - parseFloat(shape2DAttachPoint.getAttribute("cy") || "0");

                    const transform = `translate(${dx}, ${dy})`;
                    shape2DElement.setAttribute('transform', transform);
                    shape3DElement.appendChild(shape2DElement);
                } else {
                    console.warn(`Attachment points not found for 2D shape ${attached2DShape.name} or 3D shape ${component.shape}`);
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
    if (!shape || !shape.attachmentPoints || !Array.isArray(shape.attachmentPoints)) {
        return ['none'];
    }

    const points = shape.attachmentPoints
        .filter(point => point.name.startsWith('attach-'))
        .map(point => {
            const parts = point.name.split('-');
            return parts.length > 2 ? `${parts[1]}-${parts[2]}` : parts[1];
        });

    return ['none', ...new Set(points)];
};

export const calculateDistance = (point1: Point, point2: Point): number => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
};

export const findClosestAttachmentPoint = (
    clickPoint: Point,
    component: DiagramComponent
): { position: string, attachmentPoint: string } => {
    if (!Array.isArray(component.attachmentPoints) || component.attachmentPoints.length < 1) {
        return { position: 'top', attachmentPoint: 'none' };
    }

    // Filter out attachment points starting with "attach-bottom" and "attach-back"
    const validAttachmentPoints = component.attachmentPoints.filter(point =>
        !point.name.startsWith('attach-bottom') && !point.name.startsWith('attach-back')
    );

    if (validAttachmentPoints.length === 0) {
        return { position: 'top', attachmentPoint: 'none' };
    }

    let closestPoint: AttachmentPoint = validAttachmentPoints[0];
    let minDistance = Infinity;

    validAttachmentPoints.forEach((point: AttachmentPoint) => {
        if (typeof point.x === 'number' && typeof point.y === 'number') {
            const distance = calculateDistance(clickPoint, point);

            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        }
    });


    if (typeof closestPoint.name !== 'string') {
        return { position: 'top', attachmentPoint: 'none' };
    }

    const nameParts = closestPoint.name.split('-');
    if (nameParts.length < 2 || nameParts[0] !== 'attach') {
        return { position: 'top', attachmentPoint: 'none' };
    }

    let position: string;
    let specific: string;

    if (nameParts[1] === 'front' && (nameParts[2] === 'left' || nameParts[2] === 'right')) {
        position = `${nameParts[1]}-${nameParts[2]}`;
        specific = nameParts.slice(3).join('-');
    } else {
        position = nameParts[1];
        specific = nameParts.slice(2).join('-');
    }

    return {
        position: position,
        attachmentPoint: specific ? `${position}-${specific}` : 'none'
    };
};

export const getClosestAttachmentPoint = (
    clickX: number,
    clickY: number,
    component: DiagramComponent
): { position: string, attachmentPoint: string } => {
    const clickPoint: Point = { x: clickX, y: clickY };
    return findClosestAttachmentPoint(clickPoint, component);
};


// Functions to Save and Load a composition in Diagram Components

export const serializeDiagramComponents = (
    diagramComponents: DiagramComponent[]
): string => {
    // Map each component to only include the necessary attributes
    // SVG content is loaded from the active library when deserializing
    const serializedComponents = diagramComponents.map(component => {
        const serializedComponent: SerializedDiagramComponent = {
            id: component.id,
            shape: component.shape,
            position: component.position,
            relativeToId: component.relativeToId,
            attached2DShapes: component.attached2DShapes
        };
        return serializedComponent;
    });

    return JSON.stringify(serializedComponents, null, 2);
};

export const deserializeDiagramComponents = (
    serializedData: string,
): DiagramComponent[] => {
    const parsedData = JSON.parse(serializedData);

    if (!validateLoadedFile(parsedData)) {
        throw new Error('Invalid diagram components structure');
    }

    // Reconstruct the full DiagramComponent structure
    // SVG content for shapes will be loaded from the active library
    return parsedData.map((component: SerializedDiagramComponent) => ({
        ...component,
        attachmentPoints: [],  // Will be computed by compileDiagram using library SVG
        absolutePosition: { x: 0, y: 0 },  // Will be computed by compileDiagram
        cut: false  // Reset cut state on load
    }));
};

// Update validation function to check only serialized attributes
export const validateLoadedFile = (
    data: any
): boolean => {
    if (!Array.isArray(data)) return false;

    // Check if components have the required structure
    for (const component of data) {
        if (!component.id || !component.shape || !component.position) return false;
        if (!Array.isArray(component.attached2DShapes)) return false;

        // Validate attached2DShapes - only need name and attachedTo
        // SVG content will be loaded from library
        for (const shape of component.attached2DShapes) {
            if (typeof shape.name !== 'string' || typeof shape.attachedTo !== 'string') return false;
        }
    }

    return true;
};