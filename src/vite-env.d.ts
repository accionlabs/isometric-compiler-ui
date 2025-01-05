/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_API_KEY: string;
    readonly VITE_GOOGLE_CLIENT_ID: string;
    readonly VITE_SERVER_URL: string;
    readonly VITE_GATEWAY_API_URL: string;
    readonly VITE_ISOMETRIC_AIP_URL: string;
    readonly VITE_DEFAULT_LIBRARY_ID: string;
    // Add other environment variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.svg" {
    const content: string;
    export default content;
}
