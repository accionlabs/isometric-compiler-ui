import { config } from "@/config";
import keycloak from "./keycloak";
import { DocumentResponse } from "@/Types";

export async function getDocumentByuuid(
    uuid: string,
    withFilter: boolean = false
): Promise<{ data: DocumentResponse[] }> {
    let url = `${config.isometricApiUrl}/documents/?sortName=updatedAt&sortOrder=desc&filters[uuid][eq]=${uuid}`;
    if (withFilter)
        url =
            url +
            "&selectFields=_id,architectureMetricsGenerated,agent,fileIndexedStatus,functionalMetricsGenerated";

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
