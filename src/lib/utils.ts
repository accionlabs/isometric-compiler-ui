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

export const mergeArrays = <T extends Record<string, any>>(
    array1: T[],
    array2: T[],
    key: keyof T
): T[] => {
    // Combine both arrays
    const combined = [...array1, ...array2];

    // Create a map to store unique items based on the dynamic key
    const uniqueItemsMap = new Map<any, T>();

    // Iterate over the combined array
    for (const item of combined) {
        uniqueItemsMap.set(item[key], item);
    }

    // Convert the map back to an array
    return Array.from(uniqueItemsMap.values());
};
