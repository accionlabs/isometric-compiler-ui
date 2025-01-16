// @/services/categories.ts
import { Category } from "@/Types";
import { config } from "@/config";

export async function getCategories(format: string): Promise<Category[]> {
    const url = `${config.isometricApiUrl}/categories?format=${format}`;

    try {
        const response = await fetch(url);

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

export async function getCategoriesFlat(): Promise<{ data: Category[] }> {
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
        return { data: [] };
    }
}
