import fetcher from "./request";
import { config } from "../config";
import {
    AttachmentPoint,
    Component,
    DiagramComponent,
    LibraryData,
    Shape
} from "@/Types";
import { Description } from "@radix-ui/react-dialog";
export async function getLibraries(): Promise<LibraryData[]> {
    const libraryRes: any[] = await fetcher(
        `${config.gatewayApiUrl}/isometric/library?status=active`,
        "get",
        undefined,
        true
    );
    return libraryRes.map((library) => {
        return {
            id: String(library.id),
            name: library.name,
            description: library.description,
            // shapes: Shape[];
            // spreadsheetUrl?: string;
            // folderUrl?: string;
            shapes: [],
            lastUpdated: library.updatedat,
            totalShapes: library.total_shapes
        };
    });
}

export async function getShapes(libraryIds?: string[]): Promise<Shape[]> {
    let query = "";
    if (libraryIds) {
        libraryIds.map((library) => (query = `${query}libraryIds=${library}&`));
    }
    const shapeResp: { shapes: any[] } = await fetcher(
        `${config.gatewayApiUrl}/isometric/shapes?${query}status=active`,
        "get",
        undefined,
        true
    );
    const updatedShapes: Shape[] = shapeResp.shapes.map((shape) => {
        return {
            id: shape.id,
            name: shape.name,
            type: shape.type,
            attachTo: shape.attachto,
            svgFile: shape.name,
            svgContent: shape.svgcontent,
            description: shape.description,
            status: shape.status
        };
    });
    return updatedShapes;
}

export async function createLibrary(payload: {
    name: string;
    desctiption: string;
    metadata?: any;
    type: "shapes" | "components";
}): Promise<LibraryData> {
    const res = await fetcher<any, any>(
        `${config.gatewayApiUrl}/isometric/library`,
        "post",
        payload,
        true,
        false
    );
    return {
        id: String(res.id),
        name: res.name,
        shapes: [],
        description: res.description,
        lastUpdated: res.updatedat,
        totalShapes: 0
    };
}

type ShapeReq = {
    name: string;
    description?: string;
    attachTo?: string;
    svgContent: string;
    type: "2D" | "3D";
};

export async function updateShape(payload: Shape): Promise<any> {
    const body = {
        attachTo: payload.attachTo || "",
        description: payload.description,
        status: payload.status,
        type: payload.type,
        svgContent: payload.svgContent
    };
    const shapeResp = await fetcher(
        `${config.gatewayApiUrl}/isometric/shapes/${payload.id}`,
        "put",
        body,
        true
    );
    return shapeResp;
}
export async function createBulkShapes(payload: {
    updateMode?: "replace" | "append";
    id?: string;
    name?: string;
    description?: string;
    shapes: ShapeReq[];
}): Promise<LibraryData> {
    const resp = await fetcher<any, any>(
        `${config.gatewayApiUrl}/isometric/createShapes`,
        "post",
        payload,
        false,
        false
    );
    return {
        id: String(resp.libraryData.id),
        name: resp.libraryData.name,
        shapes: [],
        description: resp.libraryData.description,
        lastUpdated: resp.libraryData.updatedat,
        totalShapes: resp.shapeCount
    };
}

export async function getComponents(
    libraryIds?: string[]
): Promise<Component[]> {
    let query = "";
    if (libraryIds) {
        query = libraryIds.map((library) => `libraryIds=${library}`).join("&");
    }

    try {
        const compresp: ComponentResp[] = await fetcher(
            `${config.gatewayApiUrl}/isometric/component?${query}&status=active`,
            "get",
            undefined,
            true
        );

        const updatedShapes: Component[] = compresp.map((comp) => {
            return {
                id: comp.name,
                dbId: comp.id,
                name: comp.name,
                attachmentPoints: comp.metadata.attachmentPoints,
                diagramComponents: comp.metadata.diagramComponents,
                description: comp.description,
                status: comp.status as "active" | "inactive",
                created: new Date(comp.createdat),
                lastModified: new Date(comp.updatedat)
            };
        });

        return updatedShapes;
    } catch (error) {
        console.error("Error fetching components", error);
        return []; // Return an empty array if an error occurs
    }
}

type ComponentResp = {
    id: string;
    slug: string;
    name: string;
    description: string;
    metadata: {
        attachmentPoints: AttachmentPoint[];
        diagramComponents: DiagramComponent[];
    };
    status: string;
    createdat: string; // ISO date string
    updatedat: string; // ISO date string
    library_name: string;
    library_metadata: {
        [key: string]: string; // flexible key-value pair for metadata
    };
    library_type: string;
    library_status: string;
};
