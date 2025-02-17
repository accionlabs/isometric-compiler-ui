import { Shape, ShapesLibrary } from "@/Types";

class ShapesLibraryManager {
    private static instance: ShapesLibraryManager | null = null;
    private static library: ShapesLibrary = {
        shapes: {},
        lastModified: new Date()
    };

    public static getInstance(): ShapesLibraryManager {
        if (!ShapesLibraryManager.instance) {
            ShapesLibraryManager.instance = new ShapesLibraryManager();
        }
        return ShapesLibraryManager.instance;
    }

    public getAllShapes(): Shape[] {
        return Object.values(ShapesLibraryManager.library.shapes);
    }

    public getShape(id: string): Shape | null {
        return ShapesLibraryManager.library.shapes[id] || null;
    }

    public getAllComponentsMap(): { [key: string]: Shape } {
        return ShapesLibraryManager.library.shapes;
    }

    public clearLibrary(): void {
        ShapesLibraryManager.library = {
            shapes: {},
            lastModified: new Date()
        };
    }

    public deserializeShapesLib = (shapes: Shape[]): void => {
        shapes.forEach((shape) => {
            const now = new Date();
            ShapesLibraryManager.library.shapes[shape.name] = shape;
            ShapesLibraryManager.library.lastModified = now;
        });
    };

    public getLibraryState(): ShapesLibrary {
        return ShapesLibraryManager.library;
    }

    public addShape(shape: Shape): void {
        ShapesLibraryManager.library.shapes[shape.name] = shape;
        ShapesLibraryManager.library.lastModified = new Date();
    }

    public removeShape(shapeName: string): void {
        delete ShapesLibraryManager.library.shapes[shapeName];
        ShapesLibraryManager.library.lastModified = new Date();
    }

    public updateShape(shape: Shape): void {
        if (ShapesLibraryManager.library.shapes[shape.name]) {
            ShapesLibraryManager.library.shapes[shape.name] = shape;
            ShapesLibraryManager.library.lastModified = new Date();
        }
    }
}

export const shapesLibraryManager = ShapesLibraryManager.getInstance();
