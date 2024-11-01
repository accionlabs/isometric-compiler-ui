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
    type: '2D' | '3D';  // Changed to specific string literal types
    attachTo?: string;
    svgFile?:string;
    svgContent: string;
}

// DiagramComponent interface
export interface DiagramComponent {
    id: string;
    shape: string;
    position: 'center' | 'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left' | string;  // Added string to allow custom positions
    relativeToId: string | null;
    attached2DShapes: Attached2DShape[];
    attachmentPoints: AttachmentPoint[];
    absolutePosition: Point;
    cut: boolean;
}

// Define a type for the serialized component structure
export interface SerializedDiagramComponent {
    id: string;
    shape: string;  // Just the shape name - SVG content will be loaded from library
    position: 'center' | 'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left' | string;
    relativeToId: string | null;
    attached2DShapes: {  // Only stores references to shapes - SVG content from library
        name: string;    // Shape name to look up in library
        attachedTo: string;  // Attachment point identifier
    }[];
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
