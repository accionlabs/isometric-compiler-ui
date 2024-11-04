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

export interface GlobalAttachmentPoint extends Point {
    componentId: string;  // ID of the component this point belongs to
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
    type?: string;     // References componentType from schema (optional)
    position: "center" | "top" | "front-right" | "front-left" | "back-right" | "back-left" | string;
    relativeToId: string | null;
    attached2DShapes: Attached2DShape[];
    attachmentPoints?: AttachmentPoint[];
    absolutePosition?: Point;
    cut?: boolean;
    metadata?: {      // Optional metadata based on component type schema
        [key: string]: any;
    };
}

// Define a type for the serialized component structure
export interface SerializedDiagramComponent {
    id: string;
    shape: string;
    position:
    | "center"
    | "top"
    | "front-right"
    | "front-left"
    | "back-right"
    | "back-left"
    | string;
    relativeToId: string | null;
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
    margin: number,
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