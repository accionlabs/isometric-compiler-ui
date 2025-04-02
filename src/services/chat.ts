// @/services/chat.ts

import { config } from "@/config";
import { v4 as uuidv4 } from "uuid";
import { getShapesByName } from "./shapes";
import { shapesLibraryManager } from "../lib/shapesLib";
import { componentLibraryManager } from "../lib/componentLib";
import { DiagramComponent, MessageResponse } from "@/Types";
import keycloak from "./keycloak";
const newUUID = uuidv4();

interface Chat {
    _id: string;
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
    data: Chat[];
    total: number;
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

    const response = await fetch(`${config.isometricApiUrl}/chat`, {
        method: "POST",
        body: formData,
        headers: {
            Authorization: `Bearer ${keycloak.token}`
        }
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
    const url = `${config.isometricApiUrl}/chat/byUUID/${uuid}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${keycloak.token}`
        }
    });

    // Check if the response is ok (status code in the range 200-299)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
}

export async function getMessageById(id?: string): Promise<Chat> {
    const url = `${config.isometricApiUrl}/chat/${id}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${keycloak.token}`
        }
    });

    // Check if the response is ok (status code in the range 200-299)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
}

export async function getSignedUrl(folderName: string, path: string) {
    const url = `${
        config.isometricApiUrl
    }/documents/get-signed-url/${encodeURIComponent(
        `isometric/${folderName}/${path}`
    )}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${keycloak.token}`
        }
    });

    // Check if the response is ok (status code in the range 200-299)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    return result;
}

export async function getDocumentsSignedUrlById(id: string) {
    const url = `${config.isometricApiUrl}/documents/get-signed-url/${id}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${keycloak.token}`
        }
    });

    // Check if the response is ok (status code in the range 200-299)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    return result;
}

export async function getReport(uuid: string) {
    const url = `${config.isometricApiUrl}/semantic-model/byUUID/${uuid}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${keycloak.token}`
        }
    });

    // Check if the response is ok (status code in the range 200-299)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
}
