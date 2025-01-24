// @/services/categories.ts
import { config } from "@/config";
import keycloak from "./keycloak";

export async function saveDiagram(body: {}): Promise<any[]> {
    const url = `${config.isometricApiUrl}/diagram`;
    const bu = {
        name: "Sample Diagram",
        version: "1.0.0",
        metadata: {
            project: "AI development",
            priority: "high"
        },
        diagramComponents: []
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
        return [];
    }
}
