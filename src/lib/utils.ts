import { Shape, ShapeResponse, Component } from "@/Types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const segregateShapesAndComponents = (response: ShapeResponse[]) => {
    const shapes: Shape[] = [];
    const components: Component[] = [];

    response.forEach((item) => {
        // Convert to Shape if type is "2D" or "3D"
        if (item.type === "2D" || item.type === "3D") {
            shapes.push({
                name: item.name,
                type: item.type,
                attachTo: item.attachTo ?? undefined,
                svgFile: item.svgFile ?? "",
                svgContent: item.svgContent ?? ""
            });
        }

        // Convert to Component if type is "COMPONENT"
        if (item.type === "COMPONENT") {
            components.push({
                _id: item._id,
                id: item.name,
                name: item.name,
                description: item.category, // Assuming category is used as a description
                diagramComponents: item.diagram_components,
                attachmentPoints: item.attachment_points,
                svgContent: item.svgContent ?? undefined,
                created: new Date(item.createdAt),
                lastModified: new Date(item.updatedAt)
            });
        }
    });

    return { shapes, components };
};
