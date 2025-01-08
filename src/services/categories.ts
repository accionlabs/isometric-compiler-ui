// @/services/categories.ts
import { Category } from "@/Types";
import { config } from "@/config";

export async function getCategories(): Promise<Category[] | undefined> {
    const url = `${config.isometricApiUrl}/categories?format=nested`;

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
