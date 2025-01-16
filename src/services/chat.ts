// @/services/chat.ts

import { config } from "@/config";
import { v4 as uuidv4 } from "uuid";
import { getShapesByName } from "./shapes";
import { shapesLibraryManager } from "../lib/shapesLib";
import { componentLibraryManager } from "../lib/componentLib";
import { DiagramComponent } from "@/Types";
const newUUID = uuidv4();

export async function sendChatRequest(query: string,currentState:DiagramComponent[]) {
    const url = `${config.gatewayApiUrl}/document/isometric/v2?uuid=${newUUID}`;

    try {
        const response = await fetch(url, {
            method: "POST", // Specify the method as POST
            headers: {
                "Content-Type": "application/json" // Set the Content-Type header
            },
            body: JSON.stringify({ query,currentState:currentState }) // Convert the data object to a JSON string
        });

        // Check if the response is ok (status code in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const res = await response.json(); // Parse the JSON response
        if (
            res.action?.shapeName &&
            res.action?.action === "add"
        ) {
            const shapes = await getShapesByName([res.action.shapeName]);
            if(shapes){
                shapesLibraryManager.deserializeShapesLib(shapes.shapes);
                componentLibraryManager.deserializeComponentLib(shapes.components);
            }
        }
        return res;
    } catch (error) {
        console.error("Error:", error); // Handle errors
    }
}
