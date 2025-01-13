import { Shape, ShapesLibrary } from "@/Types";

class ShapesLibraryManager {
    private static instance: ShapesLibraryManager;
    private library: ShapesLibrary;

    private constructor() {
        this.library = this.loadLibrary();
    }

    public static getInstance(): ShapesLibraryManager {
        if (!ShapesLibraryManager.instance) {
            ShapesLibraryManager.instance = new ShapesLibraryManager();
        }
        return ShapesLibraryManager.instance;
    }

    private loadLibrary(): ShapesLibrary {
        const savedLibrary = localStorage.getItem("ShapesLibrary");
        if (savedLibrary) {
            const parsed = JSON.parse(savedLibrary);
            return {
                ...parsed,
                lastModified: new Date(parsed.lastModified)
            };
        }
        return {
            shapes: {},
            lastModified: new Date()
        };
    }

    private saveLibrary(): void {
        localStorage.setItem("ShapesLibrary", JSON.stringify(this.library));
    }

    public getAllShapes(): Shape[] {
        return Object.values(this.library.shapes);
    }
    public getShape(id: string): Shape | null {
        return this.library.shapes[id] || null;
    }
    public getAllComponentsMap(): { [key: string]: Shape } {
        return this.library.shapes;
    }

    public clearLibrary(): void {
        this.library = {
            shapes: {},
            lastModified: new Date()
        };
        this.saveLibrary();
    }
    public deserializeShapesLib = (shapes: Shape[]) => {
        shapes.forEach((shape) => {
            const now = new Date();
            this.library.shapes[shape.name] = shape;
            this.library.lastModified = now;
            this.saveLibrary();
        });
    };
}

export const shapesLibraryManager = ShapesLibraryManager.getInstance();
