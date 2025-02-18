import { toPng, toSvg } from "html-to-image";
import { ReactFlowInstance } from "@xyflow/react";
import { cleanSVG } from "./svgUtils";

interface ExportOptions {
    fileName?: string;
    backgroundColor?: string;
    quality?: number;
    scale?: number;
    cleanupSvg?: boolean; // New option to control SVG cleanup
}

const defaultOptions: ExportOptions = {
    fileName: "diagram",
    backgroundColor: "#ffffff",
    quality: 1,
    scale: 2,
    cleanupSvg: true // Enable SVG cleanup by default
};

export const exportToImage = async (
    type: "svg" | "png" = "svg",
    options: ExportOptions = {}
): Promise<void> => {
    const opts = { ...defaultOptions, ...options };

    // Get the flow element
    const flowElement = document.querySelector(".react-flow") as HTMLElement;
    if (!flowElement) throw new Error("React Flow element not found");

    try {
        // Temporarily remove transform to capture the entire diagram
        const currentTransform = flowElement.style.transform;
        flowElement.style.transform = "none";

        // Create filter to exclude unwanted elements
        const filter = (node: HTMLElement) => {
            const exclude = [
                "react-flow__controls",
                "react-flow__minimap",
                "react-flow__panel",
                "react-flow__background",
                "react-flow__handle"
            ];
            return !exclude.some((className) =>
                node.classList?.contains(className)
            );
        };

        // Configure export options
        const exportOptions = {
            backgroundColor: opts.backgroundColor,
            filter,
            quality: opts.quality,
            scale: opts.scale,
            pixelRatio: opts.scale
        };

        // Export based on type
        let dataUrl =
            type === "svg"
                ? await toSvg(flowElement, exportOptions)
                : await toPng(flowElement, exportOptions);
        // If it's an SVG and cleanup is enabled, clean it
        if (type === "svg" && opts.cleanupSvg) {
            try {
                // Convert data URL to SVG string
                const svgString = decodeURIComponent(dataUrl.split(",")[1]);

                // Clean the SVG
                const cleanedSvgString = await cleanSVG(svgString);

                // Convert back to data URL
                dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                    cleanedSvgString
                )}`;
            } catch (cleanError) {
                console.warn("SVG cleanup failed:", cleanError);
                // Continue with uncleaned SVG if cleaning fails
            }
        }

        // Restore original transform
        flowElement.style.transform = currentTransform;

        // Download the image
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${opts.fileName}.${type}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error(`Failed to export diagram as ${type}:`, error);
        throw error;
    }
};

// Convenience functions
export const exportAsSVG = (options?: ExportOptions) =>
    exportToImage("svg", options);

export const exportAsPNG = (options?: ExportOptions) =>
    exportToImage("png", options);
