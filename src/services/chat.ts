// @/services/chat.ts

import { config } from "@/config";
import { v4 as uuidv4 } from "uuid";
import { getShapesByName } from "./shapes";
import { shapesLibraryManager } from "../lib/shapesLib";
import { componentLibraryManager } from "../lib/componentLib";
import { DiagramComponent } from "@/Types";
const newUUID = uuidv4();

export async function sendChatRequest(
    query: string,
    currentState: DiagramComponent[]
) {
    const url = `${config.gatewayApiUrl}/document/isometric/v2?uuid=${newUUID}`;

    try {
        const response = await fetch(url, {
            method: "POST", // Specify the method as POST
            headers: {
                "Content-Type": "application/json" // Set the Content-Type header
            },
            body: JSON.stringify({ query, currentState: currentState }) // Convert the data object to a JSON string
        });

        // Check if the response is ok (status code in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const shapeNames = [];
        const res = await response.json(); // Parse the JSON response
        for (let i = 0; i < res.action?.length; i++) {
            if (res.action[i].shapeName && res.action[i].action === "add") {
                shapeNames.push(res.action[i].shapeName);
            }
        }
        if (shapeNames.length>0) {
            const shapes = await getShapesByName(shapeNames);
            if (shapes) {
                shapesLibraryManager.deserializeShapesLib(shapes.shapes);
                componentLibraryManager.deserializeComponentLib(
                    shapes.components
                );
            }
        }
        return res;
    } catch (error) {
        console.error("Error:", error); // Handle errors
    }
}
