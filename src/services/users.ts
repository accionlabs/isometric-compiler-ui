import { config } from "@/config";

export async function login(token: string) {
    try {

        const url = `${config.isometricApiUrl}/users/login`;
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({ token }),
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json(); // Parse the JSON response
    } catch(e) {
        console.error("Error:", e)
    }
}