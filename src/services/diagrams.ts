// @/services/categories.ts
import { config } from "@/config";
import keycloak from "./keycloak";
import { DiagramComponent, DiagramInfo } from "@/Types";

export async function getDiagrams(): Promise<
    { data: DiagramInfo[]; total: number } | undefined
> {
    const url = `${config.isometricApiUrl}/diagram`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${keycloak.token}`
            }
        });

        // Check if the response is ok (status code in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json(); // Parse the JSON response
    } catch (error) {
        console.error("Error:", error); // Handle errors
    }
}

export async function saveDiagram(payload: {
    name: string;
    description: string;
    diagramComponents: DiagramComponent[];
    svgContent: string;
}): Promise<DiagramInfo | undefined> {
    const url = `${config.isometricApiUrl}/diagram`;
    const body = {
        name: payload.name,
        version: "1.0.0",
        metadata: {
            description: payload.description,
            svgContent: payload.svgContent
        },
        diagramComponents: payload.diagramComponents
    };
    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${keycloak.token}`
            }
        });

        // Check if the response is ok (status code in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json(); // Parse the JSON response
    } catch (error) {
        console.error("Error:", error); // Handle errors
    }
}

export async function updateDiagram(payload: {
    id: string;
    name: string;
    description: string;
    diagramComponents: DiagramComponent[];
    svgContent: string;
}): Promise<DiagramInfo | undefined> {
    const url = `${config.isometricApiUrl}/diagram/${payload.id}`;
    const body = {
        name: payload.name,
        version: "1.0.0",
        metadata: {
            description: payload.description,
            svgContent: payload.svgContent
        },
        diagramComponents: payload.diagramComponents
    };
    try {
        const response = await fetch(url, {
            method: "PUT",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${keycloak.token}`
            }
        });

        // Check if the response is ok (status code in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json(); // Parse the JSON response
    } catch (error) {
        console.error("Error:", error); // Handle errors
    }
}
