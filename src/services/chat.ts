// @/services/chat.ts

import { config } from "@/config";
import { v4 as uuidv4 } from "uuid";
import { getShapesByName } from "./shapes";
import { shapesLibraryManager } from "../lib/shapesLib";
import { componentLibraryManager } from "../lib/componentLib";
import { DiagramComponent, MessageResponse } from "@/Types";
const newUUID = uuidv4();

interface Chat {
    id: string;
    message: string;
    messageType: "text" | "json" | "file";
    createdAt: string;
    role: "system" | "user";
    metadata: {
        fileUrl?: string;
        fileType?: "image" | "pdf";
        fileName?: string;
        content?: any;
    };
}
interface ChatResponse {
    chats: Chat[];
}

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
        const res = await response.json(); // Parse the JSON response
        return res;
    } catch (error) {
        console.error("Error:", error); // Handle errors
    }
}

export async function sendImageChatRequest(image: string) {
    const formData = new FormData();
    if (image) {
        const imageFile = await fetch(image)
            .then((res) => res.blob())
            .then(
                (blob) =>
                    new File([blob], "selectedImage.jpg", { type: blob.type })
            );
        formData.append("image", imageFile);
    }

    const response = await fetch(
        `${config.gatewayApiUrl}/document/isometric/v2/image`,
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error("Failed to send the message.");
    }

    const result = await response.json();
    return result;
}

export async function sendChatRequestV2({
    query,
    uuid,
    currentState,
    file
}: {
    query: string;
    uuid: string;
    currentState?: DiagramComponent[];
    file?: File;
}): Promise<MessageResponse> {
    const formData = new FormData();
    if (file) {
        formData.append("file", file);
    }
    if (currentState) {
        formData.append("currentState", JSON.stringify(currentState));
    }
    formData.append("query", query);
    formData.append("uuid", uuid);

    const response = await fetch(`${config.gatewayApiUrl}/isometric/chat`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        throw new Error("Failed to send the message.");
    }

    const shapeNames = [];
    const res: MessageResponse = await response.json(); // Parse the JSON response
    for (let i = 0; i < res.metadata.action?.length; i++) {
        if (
            res.metadata.action[i].shapeName &&
            res.metadata.action[i].action === "add"
        ) {
            shapeNames.push(res.metadata.action[i].shapeName);
        }
    }
    if (shapeNames.length > 0) {
        const shapes = await getShapesByName(shapeNames);
        if (shapes) {
            shapesLibraryManager.deserializeShapesLib(shapes.shapes);
            componentLibraryManager.deserializeComponentLib(shapes.components);
        }
    }
    return res;
}

export async function getChatByuuid(uuid: string): Promise<ChatResponse> {
    const url = `${config.gatewayApiUrl}/isometric/chat/${uuid}`;

    const response = await fetch(url);

    // Check if the response is ok (status code in the range 200-299)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
}

export async function getSignedUrl(path: string) {
    const url = `${
        config.gatewayApiUrl
    }/isometric/get-signed-url/${encodeURIComponent(
        `isometric/image/${path}`
    )}`;
    const response = await fetch(url);

    // Check if the response is ok (status code in the range 200-299)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    return result;
}

export async function getReport(uuid: string) {
    const url = `${config.gatewayApiUrl}/isometric/semantic-model/${uuid}`;
    const response = await fetch(url);

    // Check if the response is ok (status code in the range 200-299)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
}
