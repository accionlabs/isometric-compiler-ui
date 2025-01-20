// @/lib/svgUtils.ts

import { Point, ViewBox, TransformationContext, CanvasSize } from "@/Types";
import { SVGLibraryManager } from "./svgLibraryUtils";

export const DEFAULT_MARGIN = 20;

export const extractTranslation = (
    transform: string | null
): { x: number; y: number } => {
    if (!transform) return { x: 0, y: 0 };
    const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
    if (match) {
        return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    }
    return { x: 0, y: 0 };
};

export const calculateBoundingBox = (
    svgElement: SVGSVGElement
): { x: number; y: number; width: number; height: number } | null => {
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

    svgElement.querySelectorAll(":scope > g").forEach((element) => {
        if (element instanceof SVGGraphicsElement) {
            const bbox = element.getBBox();
            const { x: translateX, y: translateY } = extractTranslation(
                element.getAttribute("transform")
            );

            minX = Math.min(minX, bbox.x + translateX);
            minY = Math.min(minY, bbox.y + translateY);
            maxX = Math.max(maxX, bbox.x + bbox.width + translateX);
            maxY = Math.max(maxY, bbox.y + bbox.height + translateY);
        }
    });

    if (
        minX !== Infinity &&
        minY !== Infinity &&
        maxX !== -Infinity &&
        maxY !== -Infinity
    ) {
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    return null;
};

export const calculateSVGBoundingBox = (
    svgContent: string,
    canvas: CanvasSize
): ViewBox | null => {
    try {
        // Create temporary container
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.visibility = "hidden";
        container.style.pointerEvents = "none";
        container.style.width = `${canvas ? canvas.width : 1000}px`;
        container.style.height = `${canvas ? canvas.height : 1000}px`;
        document.body.appendChild(container);

        // Create SVG element with wrapper
        const wrapperSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%">
                ${svgContent}
            </svg>
        `;
        container.innerHTML = wrapperSvg;

        // Get the SVG element
        const svg = container.querySelector("svg");
        if (!svg) {
            throw new Error("Failed to create SVG element");
        }

        // Initialize bounds
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        // Get all SVG groups
        const groups = svg.querySelectorAll("g");

        groups.forEach((group) => {
            if (group instanceof SVGGraphicsElement) {
                try {
                    const bbox = group.getBBox();
                    const ctm = group.getCTM();

                    if (ctm) {
                        // Transform points using CTM
                        const points = [
                            { x: bbox.x, y: bbox.y },
                            { x: bbox.x + bbox.width, y: bbox.y },
                            { x: bbox.x, y: bbox.y + bbox.height },
                            { x: bbox.x + bbox.width, y: bbox.y + bbox.height }
                        ];

                        points.forEach((point) => {
                            const transformedPoint = new DOMPoint(
                                point.x,
                                point.y
                            ).matrixTransform(ctm);
                            minX = Math.min(minX, transformedPoint.x);
                            minY = Math.min(minY, transformedPoint.y);
                            maxX = Math.max(maxX, transformedPoint.x);
                            maxY = Math.max(maxY, transformedPoint.y);
                        });
                    }
                } catch (error) {
                    console.warn("Error calculating bounds for group:", error);
                }
            }
        });

        // Cleanup
        document.body.removeChild(container);

        // Check if we found valid bounds
        if (
            minX === Infinity ||
            minY === Infinity ||
            maxX === -Infinity ||
            maxY === -Infinity
        ) {
            console.warn("No valid bounds found in SVG content");
            return null;
        }

        // Add some padding
        const padding = 10;
        return {
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2
        };
    } catch (error) {
        console.error("Error calculating SVG bounding box:", error);
        return null;
    }
};

export const processSVGFile = async (svgFile: File): Promise<string> => {
    try {
        // Read the content of the SVG file as a string
        const svgContent = await SVGLibraryManager.readFileAsText(svgFile);
        return svgContent;
    } catch (error) {
        console.error("Error processing SVG file:", error);
        throw new Error("Failed to read SVG file content.");
    }
};

// Enhanced transform parsing with scale support
const parseTransform = (
    transform: string | null
): { translateX: number; translateY: number; scale: number } => {
    if (!transform) return { translateX: 0, translateY: 0, scale: 1 };

    let translateX = 0;
    let translateY = 0;
    let scale = 1;

    // Match all transform operations
    const operations = transform.match(/\w+\([^)]+\)/g) || [];

    operations.forEach((operation) => {
        // Parse translate
        const translateMatch = operation.match(
            /translate\(([-\d.]+)(?:,\s*([-\d.]+))?\)/
        );
        if (translateMatch) {
            translateX += parseFloat(translateMatch[1]) || 0;
            translateY +=
                parseFloat(translateMatch[2] || translateMatch[1]) || 0;
        }

        // Parse scale
        const scaleMatch = operation.match(
            /scale\(([-\d.]+)(?:,\s*([-\d.]+))?\)/
        );
        if (scaleMatch) {
            const scaleX = parseFloat(scaleMatch[1]) || 1;
            const scaleY = parseFloat(scaleMatch[2] || scaleMatch[1]) || 1;
            scale *= Math.max(scaleX, scaleY); // Use larger scale factor
        }

        // Parse matrix
        const matrixMatch = operation.match(
            /matrix\(([-\d.]+,\s*){5}[-\d.]+\)/
        );
        if (matrixMatch) {
            const values = matrixMatch[0]
                .slice(7, -1)
                .split(/,\s*/)
                .map(parseFloat);

            // Extract scale and translation from matrix
            const scaleX = Math.sqrt(
                values[0] * values[0] + values[1] * values[1]
            );
            const scaleY = Math.sqrt(
                values[2] * values[2] + values[3] * values[3]
            );
            scale *= Math.max(scaleX, scaleY);
            translateX += values[4];
            translateY += values[5];
        }
    });

    return { translateX, translateY, scale };
};

// Helper function to wrap raw SVG content in an SVG element
export const wrapSVGContent = (content: string): string => {
    return `<svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
};

// Transform SVG coordinates to React Flow canvas coordinates
export const transformSVGToCanvasCoordinates = (
    point: Point,
    context: TransformationContext
): Point => {
    const { viewBox, canvasSize, scale } = context;

    // Calculate the scaling factors
    const scaleX = (canvasSize.width / viewBox.width) * scale;
    const scaleY = (canvasSize.height / viewBox.height) * scale;

    // Use uniform scaling to maintain aspect ratio
    const uniformScale = Math.min(scaleX, scaleY);

    // Calculate centering offsets
    const offsetX = (canvasSize.width - viewBox.width * uniformScale) / 2;
    const offsetY = (canvasSize.height - viewBox.height * uniformScale) / 2;

    // Transform the point
    return {
        x: (point.x - viewBox.x) * uniformScale + offsetX,
        y: (point.y - viewBox.y) * uniformScale + offsetY
    };
};

// Transform React Flow canvas coordinates back to SVG coordinates
export const transformCanvasToSVGCoordinates = (
    point: Point,
    context: TransformationContext
): Point => {
    const { viewBox, canvasSize, scale } = context;

    // Calculate the scaling factors
    const scaleX = (canvasSize.width / viewBox.width) * scale;
    const scaleY = (canvasSize.height / viewBox.height) * scale;

    // Use uniform scaling to maintain aspect ratio
    const uniformScale = Math.min(scaleX, scaleY);

    // Calculate centering offsets
    const offsetX = (canvasSize.width - viewBox.width * uniformScale) / 2;
    const offsetY = (canvasSize.height - viewBox.height * uniformScale) / 2;

    // Transform back to SVG coordinates
    return {
        x: (point.x - offsetX) / uniformScale + viewBox.x,
        y: (point.y - offsetY) / uniformScale + viewBox.y
    };
};

// Calculate appropriate viewBox for the SVG content
export const calculateViewBox = (
    boundingBox: ViewBox,
    margin: number = DEFAULT_MARGIN
): ViewBox => {
    return {
        x: boundingBox.x - margin,
        y: boundingBox.y - margin,
        width: boundingBox.width + margin * 2,
        height: boundingBox.height + margin * 2
    };
};

// Calculate scale to fit SVG in container while preserving aspect ratio
export const calculateScale = (
    contentSize: { width: number; height: number },
    containerSize: { width: number; height: number }
): number => {
    const scaleX =
        (containerSize ? containerSize.width : 1000) / contentSize.width;
    const scaleY =
        (containerSize ? containerSize.height : 1000) / contentSize.height;
    return Math.min(scaleX, scaleY);
};

// Cleanup SVG content
export const cleanupSVG = (svgString: string): string => {
    // Remove sodipodi and inkscape elements
    svgString = svgString.replace(/<sodipodi:.*?>.*?<\/sodipodi:.*?>/g, "");
    svgString = svgString.replace(/<inkscape:.*?>.*?<\/inkscape:.*?>/g, "");

    // Remove sodipodi and inkscape attributes
    svgString = svgString.replace(
        /\s(sodipodi|inkscape):[^\s/>]+(?:="[^"]*")?\s?/g,
        " "
    );

    // Remove empty defs element
    svgString = svgString.replace(/<defs.*?>.*?<\/defs>/g, "");

    // Remove unused namespace declarations
    svgString = svgString.replace(/\s+xmlns:(sodipodi|inkscape)="[^"]*"/g, "");

    return svgString;
};

// Toggle visibility of attachment points
export const toggleAttachmentPoints = (
    element: SVGElement,
    visible: boolean
): void => {
    const attachmentPoints = element.querySelectorAll('circle[id^="attach-"]');
    attachmentPoints.forEach((point) => {
        if (point instanceof SVGElement) {
            point.style.display = visible ? "block" : "none";
        }
    });
    const parentAttachmentPoints = element.querySelectorAll(
        'circle[id^="parent-attach-"]'
    );
    parentAttachmentPoints.forEach((point) => {
        if (point instanceof SVGElement) {
            point.style.display = visible ? "block" : "none";
        }
    });
};

// Apply SVG transformations to a point
export const applySVGTransformations = (
    point: Point,
    transforms: { translateX: number; translateY: number; scale: number }
): Point => {
    return {
        x: point.x * transforms.scale + transforms.translateX,
        y: point.y * transforms.scale + transforms.translateY
    };
};

// Generate unique ID for SVG elements
export const generateSVGId = (prefix: string): string => {
    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
};

interface CleanSvgOptions {
    removeNonStandardElements?: boolean;
    preserveAspectRatio?: boolean;
    removeComments?: boolean;
    prettify?: boolean;
}

/**
 * Browser-compatible SVG cleaner that removes non-standard elements and attributes
 */
export const cleanSVG = (
    svgString: string,
    options: CleanSvgOptions = {}
): string => {
    const {
        removeNonStandardElements = true,
        preserveAspectRatio = true,
        removeComments = true,
        prettify = true
    } = options;

    let cleaned = svgString;

    if (removeComments) {
        // Remove XML comments
        cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");
    }

    if (removeNonStandardElements) {
        // Remove namespace declarations
        cleaned = cleaned
            .replace(/xmlns:(sodipodi|inkscape|sketch|ai)="[^"]*"/g, "")
            // Remove elements with non-standard namespaces
            .replace(
                /<(sodipodi|inkscape|sketch|ai):[^>]*>[^<]*([\s\S]*?<\/\1:[^>]*>)?/g,
                ""
            )
            // Remove attributes with non-standard namespaces
            .replace(
                /\s+(sodipodi|inkscape|sketch|ai):[^\s/>]+(?:="[^"]*")?/g,
                ""
            )
            // Remove empty defs element
            .replace(/<defs[^>]*>\s*<\/defs>/g, "")
            // Remove metadata
            .replace(/<metadata>[\s\S]*?<\/metadata>/g, "")
            // Clean up multiple spaces
            .replace(/\s{2,}/g, " ");
    }

    // Remove empty groups
    cleaned = cleaned.replace(/<g[^>]*>\s*<\/g>/g, "");

    // Optional: Basic prettification
    if (prettify) {
        cleaned = cleaned
            // Add newline after closing tags
            .replace(/>/g, ">\n")
            // Add newline before opening tags
            .replace(/<(?!\/)/g, "\n<")
            // Remove multiple newlines
            .replace(/\n{2,}/g, "\n")
            // Add proper indentation
            .split("\n")
            .map((line, _, array) => {
                const indent =
                    (line.match(/<\//) ? -1 : 0) +
                    (line.match(/<[^/]/) ? 1 : 0);
                const spaces = "  ".repeat(
                    Math.max(
                        0,
                        array.filter((l) => l.match(/<[^/]/)).length +
                            indent -
                            1
                    )
                );
                return spaces + line.trim();
            })
            .join("\n")
            .trim();
    }

    // Ensure SVG has proper namespace
    if (!cleaned.includes('xmlns="http://www.w3.org/2000/svg"')) {
        cleaned = cleaned.replace(
            /<svg/,
            '<svg xmlns="http://www.w3.org/2000/svg"'
        );
    }

    // Handle preserveAspectRatio
    if (preserveAspectRatio && !cleaned.includes("preserveAspectRatio")) {
        cleaned = cleaned.replace(
            /<svg/,
            '<svg preserveAspectRatio="xMidYMid meet"'
        );
    }

    return cleaned;
};

// Clip SVG to contents with padding
export const clipSVGToContents = (
    svgContent: string,
    boundingBox: ViewBox | null,
    padding: number = DEFAULT_MARGIN
): string => {
    if (!boundingBox) {
        console.warn("No bounding box available for clipping");
        return svgContent;
    }

    const cleanedSVG = cleanSVG(svgContent);
    const viewBox = calculateViewBox(boundingBox, padding);

    // Create new SVG wrapper with calculated viewBox
    return `<svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
    >${cleanedSVG}</svg>`;
};
