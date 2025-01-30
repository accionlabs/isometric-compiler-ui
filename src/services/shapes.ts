// @/services/shapes.ts
import { Component, Shape, UnifiedElement, UnifiedResponse } from "@/Types";
import { config } from "@/config";
import {
    segregateShapesAndComponents,
    transformToUnifiedResponse
} from "@/lib/serviceUtils";
import keycloak from "./keycloak";

export async function getShapesByName(names: string[]): Promise<
    | {
          shapes: Shape[];
          components: Component[];
          total: number;
      }
    | undefined
> {
    const params = names.map((item) => "filters[name][$in]=" + encodeURIComponent(item)).join("&");

    const url = `${config.isometricApiUrl}/shapes?${params}&Page=1&limit=1000`;
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${keycloak.token}`,
            },
        });

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
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${keycloak.token}`,
            },
        });

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
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${keycloak.token}`,
            },
        });

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

export async function saveComponent(payload: Component, category: string) {
    const body = {
        name: payload.name,
        type: "COMPONENT",
        attachTo: "",
        svgContent: payload.svgContent,
        version: "1.0.0",
        category,
        metadata: {
            description: payload.description
        },
        diagram_components: payload.diagramComponents,
        attachment_points: payload.attachmentPoints
    };

    const url = `${config.isometricApiUrl}/shapes`;
    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${keycloak.token}`,
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json(); // Parse the JSON response
    } catch (error) {
        console.error("Error:", error);
    }
}


export async function updateShapesComponent(payload: UnifiedElement & {category: string}) {
    const body = {
        svgContent: payload.svgContent,
        version: payload.version,
        category: payload.category,
        metadata: {
            description: payload.description
        },
        tags: payload.tags,
        status: payload.status
    };

    const url = `${config.isometricApiUrl}/shapes/${payload._id}`;
    try {
        const response = await fetch(url, {
            method: "PUT",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${keycloak.token}`,
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json(); // Parse the JSON response
    } catch (error) {
        console.error("Error:", error);
    }
}
