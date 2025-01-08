// @/services/shapes.ts
import { Component, Shape, ShapeResponse } from "@/Types";
import { config } from "@/config";
import { segregateShapesAndComponents } from "@/lib/utils";

// export async function getShapesByCaterory(
//     id: string
// ): Promise<{ data: ; total: number } | undefined> {
//     const url = `${config.isometricApiUrl}/shapes/category/${id}`;

//     try {
//         const response = await fetch(url);

//         // Check if the response is ok (status code in the range 200-299)
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         return await response.json(); // Parse the JSON response
//     } catch (error) {
//         console.error("Error:", error); // Handle errors
//     }
// }

export async function getShapesByCaterory(id: string): Promise<
    | {
          shapes: Shape[];
          components: Component[];
          total: number;
      }
    | undefined
> {
    const url = `${config.isometricApiUrl}/shapes/category/${id}`;

    try {
        const response = await fetch(url);

        // Check if the response is ok (status code in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const shapesResp: { data: ShapeResponse[]; total: number } =
            await response.json(); // Parse the JSON response
        const segregatedData = segregateShapesAndComponents(
            shapesResp?.data ?? []
        );
        return { ...segregatedData, total: shapesResp.total };
    } catch (error) {
        console.error("Error:", error); // Handle errors
    }
}
