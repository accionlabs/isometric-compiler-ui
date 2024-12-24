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
    type: "2D" | "3D"; // Changed to specific string literal types
    attachTo?: string;
    svgFile: string;
    svgContent: string;
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
    id: string;
    name: string;
    description: string;
    diagramComponents: DiagramComponent[];
    attachmentPoints: AttachmentPoint[];
    svgContent?: string;
    created: Date;
    lastModified: Date;
}

export interface ComponentLibrary {
    components: { [key: string]: Component };
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
    minSpacing: number;     // minimum X spacing between metadata labels
    minYSpacing: number;    // minimum Y spacing between metadata labels
    smoothingAngle: number; // hull smoothing angle in radians
    stepSize: number;       // distance between metadata label positions
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
    showAttachmentPoints: boolean;
}
