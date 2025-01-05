// @/services/shapes.ts
import { config } from "@/config";

export async function getShapesByCaterory() {
    const url = `${config.isometricApiUrl}/categories`;

    try {
        const response = await fetch(url);

        // Check if the response is ok (status code in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json(); // Parse the JSON response
    } catch (error) {
        console.error("Error:", error); // Handle errors
    }
}
