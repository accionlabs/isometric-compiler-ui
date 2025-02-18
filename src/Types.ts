// @/Types.ts

// CanvasSize type
export interface CanvasSize {
    width: number;
    height: number;
}

// Additional types used in DiagramComponent
export interface Attached2DShape {
    name: string;
    attachedTo: string;
}

export interface Point {
    x: number;
    y: number;
}

export interface AttachmentPoint extends Point {
    name: string;
}

// Map of attachment points for a shape, with key as its name
export interface AttachmentPointMap {
    [key: string]: AttachmentPoint;
}

// Map of array of all attachment points for a component from its constituent shapes
export interface ComponentAttachmentPointMap {
    [key: string]: AttachmentPoint[];
}

export interface GlobalAttachmentPoint {
    componentId: string; // ID of the component this point belongs to
    attachmentPoints: AttachmentPoint[];
}

// Shape interface
export interface Shape {
    name: string;
    type: "2D" | "3D" | "LAYERS"; // Changed to specific string literal types
    attachTo?: string;
    svgFile: string;
    svgContent: string;
    description?: string;
    path?: string;
    version?: string;
    tags?: string[];
    status?: "active" | "inactive";
    _id?: string;
}

export interface DependencyResult {
    missingShapes: string[];
    missingComponents: string[];
}
// Updated DiagramComponent interface
export interface DiagramComponent {
    id: string;
    shape: string;
    source?: "shape" | "component"; // Indicates if this is from SVG library or component library
    type?: string; // References componentType from schema (optional)
    position:
        | "center"
        | "top"
        | "front-right"
        | "front-left"
        | "back-right"
        | "back-left"
        | string;
    relativeToId: string | null;
    attached2DShapes: Attached2DShape[];
    attachmentPoints?: AttachmentPoint[];
    parentAttachmentPoints?: AttachmentPoint[];
    absolutePosition?: Point;
    cut?: boolean;
    metadata?: {
        // Optional metadata based on component type schema
        [key: string]: any;
    };
}

// New interfaces for Component Library
export interface Component {
    _id?: string;
    id: string;
    name: string;
    description: string;
    diagramComponents: DiagramComponent[];
    attachmentPoints: AttachmentPoint[];
    svgContent?: string;
    path?: string;
    version?: string;
    created: Date;
    lastModified: Date;
    tags?: string[];
    status?: "active" | "inactive";
}
type Metadata = {
    description: string;
    applicationTypes: string[];
    customProperties: { [key: string]: string };
    dependencies: { shapeId: string; version: string }[];
};

export interface UnifiedElement {
    _id?: string;
    id: string;
    name: string;
    description: string;
    type: "2D" | "3D" | "LAYERS" | "COMPONENT"; // Changed to specific string literal types
    attachTo?: string;
    diagramComponents?: DiagramComponent[];
    attachmentPoints?: AttachmentPoint[];
    svgFile?: string;
    svgContent?: string;
    path?: string;
    version?: string;
    created?: Date;
    lastModified?: Date;
    tags?: string[];
    status: "active" | "inactive";
}
export type UnifiedResponse = {
    _id: string;
    createdAt: string;
    updatedAt: string;
    status: "active" | "inactive";
    name: string;
    type: "3D" | "2D" | "COMPONENT" | "LAYERS";
    attachTo: string | null;
    svgFile: string | null;
    svgContent: string | null;
    version: string;
    category: string;
    metadata: Metadata | null;
    tags: string[] | null;
    author: string | null;
    diagram_components: DiagramComponent[];
    attachment_points: AttachmentPoint[];
    categoryDetails?: {
        _id: string;
        path: string;
    };
};
export interface ComponentLibrary {
    components: { [key: string]: Component };
    lastModified: Date;
}

export interface ShapesLibrary {
    shapes: { [key: string]: Shape };
    lastModified: Date;
}

// Define a type for the serialized component structure
export interface SerializedDiagramComponent {
    id: string;
    shape: string;
    source?: "shape" | "component";
    position:
        | "center"
        | "top"
        | "front-right"
        | "front-left"
        | "back-right"
        | "back-left"
        | string;
    relativeToId: string | null;
    attachmentPoints?: AttachmentPoint[];

    attached2DShapes: {
        name: string;
        attachedTo: string;
    }[];
    type?: string; // Add type field
    metadata?: Record<string, any>; // Add metadata field
}

export interface LibraryData {
    id: string;
    name: string;
    description: string;
    shapes: Shape[];
    spreadsheetUrl?: string;
    folderUrl?: string;
    lastUpdated: Date;
    isLoading?: boolean;
}

export interface ViewBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TransformationContext {
    viewBox: ViewBox;
    canvasSize: CanvasSize;
    margin: number;
    scale: number;
}

export interface SVGLayout {
    viewBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    scale: number;
    offset: {
        x: number;
        y: number;
    };
}

export interface SVGDimensions {
    boundingBox: ViewBox;
    scale: number;
}

// New interfaces for component metadata
export interface MetadataFieldOption {
    label: string;
    value: string;
}

export interface MetadataField {
    name: string;
    type: "string" | "select";
    label: string;
    required?: boolean;
    options?: MetadataFieldOption[];
}

export interface ComponentType {
    displayName: string;
    fields: MetadataField[];
}

export interface ComponentTypes {
    [key: string]: ComponentType;
}

// Schema file structure
export interface SchemaDefinition {
    componentTypes: ComponentTypes;
}

// Types for Points Library
export enum Direction {
    N = "N",
    S = "S",
    W = "W",
    E = "E"
}

export interface CanvasSizeSettings {
    canvasSize: CanvasSize;
    showAttachmentPoints: boolean;
}

export interface MetadataLabelSettings {
    minSpacing: number; // minimum X spacing between metadata labels
    minYSpacing: number; // minimum Y spacing between metadata labels
    smoothingAngle: number; // hull smoothing angle in radians
    stepSize: number; // distance between metadata label positions
}

export interface LayerLabelSettings {
    width: number;
    lineSpacing: number;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
}

export interface CanvasSettings {
    canvas: CanvasSizeSettings;
    metadataLabel: MetadataLabelSettings;
    layerLabel: LayerLabelSettings;
}

export interface Category {
    _id: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    name: string;
    description: string | null;
    parent: string | null;
    path: string;
    metadata: any | null;
    ancestors: string[];
    children: Category[];
    level?: number;
    shapeCount: number;
}

export interface DependencyCheckResult {
    componentId: string;
    missingDependencies: string[];
}

export interface BatchResult {
    results: DependencyCheckResult[];
    error?: string;
}

export interface WorkerMessage {
    type: "CHECK_DEPENDENCIES_BATCH";
    payload: {
        componentIds: string[];
        svgLibrary: Shape[];
        allComponents: Component[];
        existingComponentIds: string[];
    };
}

export interface WorkerResponse {
    type: "DEPENDENCIES_RESULT_BATCH";
    payload: {
        results: DependencyCheckResult[];
        error?: string;
    };
}

export interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

export interface DiagramInfo {
    _id?: string;
    name: string;
    version: string;
    author: string;
    metadata?: {
        description: string;
        svgContent: string;
        project: string;
        priority: string;
        uuid: string;
    } | null;
    diagramComponents: DiagramComponent[];
}

export interface MessageResponse {
    uuid: string;
    message: string;
    messageType: "json" | "text" | "file";
    metadata: {
        content: any[];
        action: MessageAction[];
        needFeedback: boolean;
    };
    role: "user" | "system";
}

interface MessageAction {
    name: string;
    action: "add" | "remove" | "update";
    shapeType: "3D" | "2D" | "COMPONENT" | "LAYERS";
    shapeName: string;
    position: "top" | "front-right" | "front-left";
    relativeTo3dShapeId: string;
}
