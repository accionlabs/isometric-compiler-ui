import { CanvasSize, Shape, Component, ComponentLibrary, DiagramComponent, AttachmentPoint } from '../Types';
import { v4 as uuidv4 } from 'uuid';
import { compileDiagram } from './diagramComponentsLib';
import { calculateSVGBoundingBox } from './svgUtils';
import { extractGlobalAttachmentPoints } from './diagramComponentsLib';

class ComponentLibraryManager {
    private static instance: ComponentLibraryManager;
    private library: ComponentLibrary;

    private constructor() {
        this.library = this.loadLibrary();
    }

    public static getInstance(): ComponentLibraryManager {
        if (!ComponentLibraryManager.instance) {
            ComponentLibraryManager.instance = new ComponentLibraryManager();
        }
        return ComponentLibraryManager.instance;
    }

    private loadLibrary(): ComponentLibrary {
        const savedLibrary = localStorage.getItem('componentLibrary');
        if (savedLibrary) {
            const parsed = JSON.parse(savedLibrary);
            return {
                ...parsed,
                lastModified: new Date(parsed.lastModified)
            };
        }
        return {
            components: {},
            lastModified: new Date()
        };
    }

    private saveLibrary(): void {
        localStorage.setItem('componentLibrary', JSON.stringify(this.library));
    }

    private getAttachmentPoints(components: DiagramComponent[]): AttachmentPoint[] {
        const globalPoints = extractGlobalAttachmentPoints(components);
        // for now, let us only take the attachment points of the first 3D shape... we can modify this later
        return globalPoints[0].attachmentPoints;
    }

    public hasComponent(name: string): boolean {
        return Object.values(this.library.components).some(component => component.name === name);
    }

    public createComponent(
        name: string,
        description: string,
        diagramComponents: DiagramComponent[],
        overwrite:boolean = false
    ): Component | null {
        if (this.hasComponent(name) && !overwrite) {
            return null;
        }

        const now = new Date();

        // Create deep copy of diagram components to avoid reference issues
        const componentsCopy = JSON.parse(JSON.stringify(diagramComponents));
        
        const component: Component = {
            id: name,
            name,
            description,
            diagramComponents: componentsCopy,
            attachmentPoints: this.getAttachmentPoints(diagramComponents),
            created: now,
            lastModified: now
        };

        this.library.components[name] = component;
        this.library.lastModified = now;
        this.saveLibrary();

        return component;
    }

    public renderComponent(
        id: string,
        canvasSize: CanvasSize,
        svgLibrary: Shape[]
    ) : string {
        const component = this.library.components[id];
        if (!component) {
            throw new Error(`Component with id ${id} not found`);
        }
        const { svgContent:svgRender } = compileDiagram(component.diagramComponents, canvasSize, svgLibrary, false);
        const boundingBox = calculateSVGBoundingBox(svgRender, canvasSize) || {x:0,y:0,width:'100%',height:'100%'};
        const svgContent:string = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="${boundingBox.x} ${boundingBox.y} ${boundingBox.width} ${boundingBox.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                ${svgRender}
            </svg>
        `;
        // TODO: We need to remove all attachment points in the svgContent of the individual shapes and add only the component's attachment points
        // this is required to allow proper selection of the component and attachment points from the SVGNode
        this.updateComponent(id,{svgContent});
        return svgContent;
    }

    public renderAllComponents(
        canvasSize: CanvasSize,
        svgLibrary: Shape[]
    ) {
        this.getAllComponents().forEach(component => {
            this.renderComponent(component.id, canvasSize, svgLibrary);
        });
    }

    public updateComponent(
        id: string,
        updates: Partial<Omit<Component, 'id' | 'created'>>
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
        this.saveLibrary();

        return updatedComponent;
    }

    public deleteComponent(id: string): void {
        if (!this.library.components[id]) {
            throw new Error(`Component with id ${id} not found`);
        }

        delete this.library.components[id];
        this.library.lastModified = new Date();
        this.saveLibrary();
    }

    public getComponent(id: string): Component | null {
        return this.library.components[id] || null;
    }

    public getAllComponents(): Component[] {
        return Object.values(this.library.components);
    }

    public clearLibrary(): void {
        this.library = {
            components: {},
            lastModified: new Date()
        };
        this.saveLibrary();
    }

    // Helper method to create a new diagram component from a component
    public createDiagramComponentFromComponent(
        componentId: string,
        position: string = "center",
        relativeToId: string | null = null
    ): DiagramComponent | null {
        const component = this.getComponent(componentId);
        if (!component) return null;

        return {
            id: uuidv4(),
            shape: componentId,  // Store the component ID in shape field
            source: "component",
            position,
            relativeToId,
            attached2DShapes: [],
            attachmentPoints: component.attachmentPoints
        };
    }
}

export const componentLibraryManager = ComponentLibraryManager.getInstance();