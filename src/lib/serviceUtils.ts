import { Shape, UnifiedResponse, Component, UnifiedElement } from "@/Types";

export const segregateShapesAndComponents = (response: UnifiedResponse[]) => {
    const shapes: Shape[] = [];
    const components: Component[] = [];
    response.forEach((item) => {
        // Convert to Shape if type is "2D" or "3D" or "LAYERS"
        if (
            item.type === "2D" ||
            item.type === "3D" ||
            item.type === "LAYERS"
        ) {
            shapes.push({
                name: item.name,
                type: item.type,
                attachTo: item.attachTo ?? undefined,
                svgFile: item.svgFile ?? "",
                svgContent: item.svgContent ?? "",
                path: item.categoryDetails?.path ?? "",
                version: item.version ?? "",
                description: item?.metadata?.description ?? "",
                tags: item?.tags ?? [],
                _id: item._id
            });
        }

        // Convert to Component if type is "COMPONENT"
        if (item.type === "COMPONENT") {
            components.push({
                _id: item._id,
                id: item.name,
                name: item.name,
                description: item?.metadata?.description ?? "",
                diagramComponents: item.diagram_components,
                attachmentPoints: item.attachment_points,
                svgContent: item.svgContent ?? undefined,
                path: item.categoryDetails?.path ?? "",
                version: item.version ?? "",
                created: new Date(item.createdAt),
                lastModified: new Date(item.updatedAt),
                tags: item?.tags ?? []
            });
        }
    });

    return { shapes, components };
};

export const transformToUnifiedResponse = (
    response: UnifiedResponse[]
): UnifiedElement[] => {
    return response.map((item) => {
        if (item.type === "COMPONENT") {
            return {
                _id: item._id,
                id: item.name,
                name: item.name,
                description: item.metadata?.description ?? "",
                type: "COMPONENT",
                diagramComponents: item.diagram_components,
                attachmentPoints: item.attachment_points,
                svgContent: item.svgContent ?? undefined,
                path: item.categoryDetails?.path ?? "",
                version: item.version ?? "",
                created: new Date(item.createdAt),
                lastModified: new Date(item.updatedAt),
                status: item?.status
            };
        }

        return {
            id: item.name,
            name: item.name,
            description: item.metadata?.description ?? "",
            type: item.type as "2D" | "3D" | "LAYERS",
            attachTo: item.attachTo ?? undefined,
            svgFile: item.svgFile ?? "",
            svgContent: item.svgContent ?? "",
            path: item.categoryDetails?.path ?? "",
            version: item.version ?? "",
            status: item.status,
            _id: item._id
        };
    });
};
