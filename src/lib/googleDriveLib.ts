// @/lib/googleDriveLib.ts

import { config } from '../config';
import { Shape } from '../Types';

declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

const { CLIENT_ID, API_KEY, SCOPES } = config.googleKeys;

let tokenClient: any;
let accessToken: string | null = null;
let tokenExpirationTime: number | null = null;

const TOKEN_EXPIRATION_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

// Functions to handle API initiatlization and authentication

const loadGoogleApiScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.body.appendChild(script);
    });
};

const initializeGoogleApi = async (): Promise<void> => {
    console.log(`API_KEY: ${API_KEY}`);
    await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', { callback: resolve, onerror: reject });
    });

    await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    });
};

const loadGoogleAccountsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Accounts script'));
        document.body.appendChild(script);
    });
};

const initializeTokenClient = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
            if (response.error !== undefined) {
                throw (response);
            }
            accessToken = response.access_token;
            tokenExpirationTime = Date.now() + response.expires_in * 1000;
        },
    });
};

const isTokenValid = (): boolean => {
    return !!accessToken && !!tokenExpirationTime && Date.now() < tokenExpirationTime - TOKEN_EXPIRATION_BUFFER;
};

const authenticateUser = async (): Promise<void> => {
    if (isTokenValid()) {
        return;
    }

    if (!tokenClient) {
        await loadGoogleAccountsScript();
        initializeTokenClient();
    }

    return new Promise<void>((resolve, reject) => {
        try {
            tokenClient.callback = (response: any) => {
                if (response.error !== undefined) {
                    reject(response);
                } else {
                    accessToken = response.access_token;
                    tokenExpirationTime = Date.now() + response.expires_in * 1000;
                    resolve();
                }
            };
            if (accessToken) {
                tokenClient.requestAccessToken({ prompt: '' });
            } else {
                tokenClient.requestAccessToken({ prompt: 'consent' });
            }
        } catch (err) {
            console.error(err);
            reject(new Error('Error during authentication'));
        }
    });
};

// Functions to load SVG Library from Google Drive

// headers required in the index CSV spreadsheet
const REQUIRED_HEADERS = ['name', 'type', 'attachTo', 'svgFile'];

const validateHeaders = (headers: string[]): string[] => {
    const missingHeaders = REQUIRED_HEADERS.filter(header => !headers.includes(header));
    return missingHeaders;
};

const getSpreadsheetId = (spreadsheetUrl: string): string | null => {
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
};

const getFolderId = (folderUrl: string): string | null => {
    const match = folderUrl.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
};

const getFileContent = async (fileId: string): Promise<string> => {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
};

interface LoadProgress {
    currentFile: string;
    loadedFiles: number;
    totalFiles: number;
}

export const loadShapesFromGoogleDrive = async (
    spreadsheetUrl: string,
    folderUrl: string,
    onProgress: (progress: LoadProgress) => void
): Promise<Shape[]> => {
    try {
        await loadGoogleApiScript();
        await initializeGoogleApi();
        await authenticateUser();

        const spreadsheetId = getSpreadsheetId(spreadsheetUrl);
        const folderId = getFolderId(folderUrl);

        console.log(`Spreadsheet URL: ${spreadsheetUrl} id: ${spreadsheetId}`);

        if (!spreadsheetId) {
            throw new Error('Invalid spreadsheet URL');
        }
        if (!folderId) {
            throw new Error('Invalid folder URL');
        }

        // Fetch spreadsheet metadata to get the first sheet's ID
        const metadataResponse = await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId,
        });

        if (!metadataResponse.result.sheets || metadataResponse.result.sheets.length === 0) {
            throw new Error('No sheets found in the spreadsheet');
        }

        const firstSheet = metadataResponse.result.sheets[0].properties;
        const firstSheetName = firstSheet.title;

        // Fetch data from the first sheet
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: firstSheetName,
        });

        const rows = response.result.values;
        if (!rows || rows.length === 0) {
            throw new Error('No data found in the spreadsheet');
        }

        const headers = rows[0].map((header: string) => header.trim());

        // Validate headers
        const missingHeaders = validateHeaders(headers);
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        const shapes: Shape[] = [];
        const totalFiles = rows.length - 1; // Exclude header row

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const shapeData: any = {};
            headers.forEach((header: string, index: number) => {
                shapeData[header.trim()] = row[index] ? row[index].trim() : '';
            });

            onProgress({
                currentFile: shapeData.svgFile,
                loadedFiles: i,
                totalFiles: totalFiles
            });

            // Find SVG file in the folder
            const svgFileResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+name='${shapeData.svgFile}'&fields=files(id,name)`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (!svgFileResponse.ok) {
                throw new Error(`HTTP error! status: ${svgFileResponse.status}`);
            }
            const svgFileData = await svgFileResponse.json();

            if (svgFileData.files.length > 0) {
                const svgFileId = svgFileData.files[0].id;
                const svgContent = await getFileContent(svgFileId);

                shapes.push({
                    name: shapeData.name,
                    type: shapeData.type,
                    attachTo: shapeData.attachTo,
                    svgContent: svgContent,
                    svgFile:shapeData.svgFile,
                });
            } else {
                console.warn(`SVG file not found: ${shapeData.svgFile}`);
            }
        }

        return shapes;

    } catch (error) {
        console.error('Error loading shapes from Google Drive:', error);
        throw error;
    }
};

// Functions to save and load diagram JSON files in Google Drive

export const saveFileToDrive = async (fileName: string, content: string, folderPath: string): Promise<void> => {
    try {
        await authenticateUser();

        // Get or create the folder
        const folderId = await getOrCreateFolder(folderPath);

        // Check if file already exists in the folder
        const existingFile = await searchForFile(fileName, folderId);

        if (existingFile) {
            // Update existing file
            await updateFile(existingFile.id, content);
        } else {
            // Create new file in the folder
            await createFile(fileName, content, folderId);
        }
    } catch (error) {
        console.error('Error saving file to Google Drive:', error);
        throw new Error('Failed to save file to Google Drive');
    }
};

const getOrCreateFolder = async (folderPath: string): Promise<string> => {
    const folders = folderPath.split('/').filter(f => f.trim() !== '');
    let parentId = 'root';

    for (const folderName of folders) {
        const folder = await searchForFolder(folderName, parentId);
        if (folder) {
            parentId = folder.id;
        } else {
            parentId = await createFolder(folderName, parentId);
        }
    }

    return parentId;
};

const searchForFolder = async (folderName: string, parentId: string): Promise<{ id: string; name: string } | null> => {
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.files.length > 0 ? data.files[0] : null;
};

const createFolder = async (folderName: string, parentId: string): Promise<string> => {
    const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
    };

    const response = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.id;
};

// Update these functions to include folderId
const searchForFile = async (fileName: string, folderId: string): Promise<{ id: string; name: string } | null> => {
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${folderId}' in parents and trashed=false`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.files.length > 0 ? data.files[0] : null;
};

const createFile = async (fileName: string, content: string, folderId: string): Promise<void> => {
    const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));

    const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: form
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
};

export const updateFile = async (fileId: string, content: string): Promise<void> => {
    try {
        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: content
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('File updated successfully');
    } catch (error) {
        console.error('Error updating file:', error);
        throw new Error('Failed to update file in Google Drive');
    }
};

const getParentFolderId = async (folderPath: string): Promise<string | null> => {
    const folders = folderPath.split('/').filter(f => f.trim() !== '');
    let parentId = 'root';

    for (const folderName of folders) {
        const folder = await searchForFolder(folderName, parentId);
        if (folder) {
            parentId = folder.id;
        } else {
            return null; // Folder not found
        }
    }

    return parentId;
};

export const loadFileFromDrive = async (fileName: string, folderPath: string): Promise<string> => {
    try {
        await authenticateUser();

        // Get the folder ID
        const folderId = await getParentFolderId(folderPath);

        if (!folderId) {
            throw new Error(`Folder ${folderPath} not found in Google Drive`);
        }

        const file = await searchForFile(fileName, folderId);
        if (!file) {
            throw new Error(`File ${fileName} not found in folder ${folderPath}`);
        }

        const content = await getFileContent(file.id);
        return content;
    } catch (error) {
        console.error('Error loading file from Google Drive:', error);
        throw new Error('Failed to load file from Google Drive');
    }
};

// ... (keep the existing searchForFolder, searchForFile, and getFileContent functions)

