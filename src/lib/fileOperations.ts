// @/lib/fileOperations.ts

import { loadFileFromDrive, saveFileToDrive } from "./googleDriveLib";

export enum StorageType {
    Local = 'local',
    GoogleDrive = 'googleDrive'
}

// Function to save file locally
export const saveLocalFile = async (fileName: string, content: string): Promise<void> => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    try {
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
    } finally {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// Function to load file locally
export const loadLocalFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            if (event.target?.result) {
                resolve(event.target.result as string);
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsText(file);
    });
};

// Combined save function
export const saveFile = async (
    storageType: StorageType,
    fileName: string,
    content: string,
    folderPath?: string
): Promise<void> => {
    if (storageType === StorageType.Local) {
        await saveLocalFile(fileName, content);
    } else {
        if (!folderPath) {
            throw new Error('Folder path is required for Google Drive storage');
        }
        await saveFileToDrive(fileName, content, folderPath);
    }
};

// Combined load function
export const loadFile = async (
    storageType: StorageType,
    fileOrPath: File | { fileName: string; folderPath: string }
): Promise<string> => {
    if (storageType === StorageType.Local) {
        if (fileOrPath instanceof File) {
            return await loadLocalFile(fileOrPath);
        }
        throw new Error('File object is required for local storage');
    } else {
        if (!(fileOrPath instanceof File) && 'fileName' in fileOrPath && 'folderPath' in fileOrPath) {
            return await loadFileFromDrive(fileOrPath.fileName, fileOrPath.folderPath);
        }
        throw new Error('File path and folder path are required for Google Drive storage');
    }
};