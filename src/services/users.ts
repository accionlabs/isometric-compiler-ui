import { config } from "@/config";
import { User } from "@/Types";
export async function login(token: string): Promise<User | undefined> {
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
        const data = await response.json(); // Parse the JSON response
        return data.user;
    } catch(e) {
        console.error("Error:", e)
    }
}