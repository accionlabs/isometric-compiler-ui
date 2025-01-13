// @/services/shapes.ts
import { Component, Shape, UnifiedElement, UnifiedResponse } from "@/Types";
import { config } from "@/config";
import {
    segregateShapesAndComponents,
    transformToUnifiedResponse
} from "@/lib/utils";

export async function getShapesByName(names: string[]): Promise<
    | {
          shapes: Shape[];
          components: Component[];
          total: number;
      }
    | undefined
> {
    const params = names.map((item) => "filters[name][$in]=" + item).join("&");

    const url = `${config.isometricApiUrl}/shapes?${params}&Page=1&limit=1000`;
    try {
        const response = await fetch(url);

        // Check if the response is ok (status code in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const shapesResp: { data: UnifiedResponse[]; total: number } =
            await response.json(); // Parse the JSON response
        const segregatedData = segregateShapesAndComponents(
            shapesResp?.data ?? []
        );
        return { ...segregatedData, total: shapesResp.total };
    } catch (error) {
        console.error("Error:", error); // Handle errors
    }
}

export async function getShapesByCategory(id: string): Promise<
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

        const shapesResp: { data: UnifiedResponse[]; total: number } =
            await response.json(); // Parse the JSON response
        const segregatedData = segregateShapesAndComponents(
            shapesResp?.data ?? []
        );
        return { ...segregatedData, total: shapesResp.total };
    } catch (error) {
        console.error("Error:", error); // Handle errors
    }
}

export async function getsearchedShapes(query: string): Promise<
    | {
          data: UnifiedElement[];
          total: number;
      }
    | undefined
> {
    const url = `${config.isometricApiUrl}/shapes/search/${query}`;
    try {
        const response = await fetch(url);

        // Check if the response is ok (status code in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const shapesResp: { data: UnifiedResponse[]; total: number } =
            await response.json(); // Parse the JSON response
        const unifiedData = transformToUnifiedResponse(shapesResp?.data ?? []);
        return { data: unifiedData, total: shapesResp.total };
    } catch (error) {
        console.error("Error:", error);
    }
}
