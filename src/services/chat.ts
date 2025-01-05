// @/services/chat.ts

import { config } from "@/config";
import { v4 as uuidv4 } from "uuid";
const newUUID = uuidv4();

export async function sendChatRequest(query: string) {
    const url = `${config.gatewayApiUrl}/document/isometric?uuid=${newUUID}`;

    try {
        const response = await fetch(url, {
            method: "POST", // Specify the method as POST
            headers: {
                "Content-Type": "application/json" // Set the Content-Type header
            },
            body: JSON.stringify({ query }) // Convert the data object to a JSON string
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
