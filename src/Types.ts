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

