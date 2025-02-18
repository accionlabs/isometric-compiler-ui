import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const mergeAndMapItems = <T extends Record<string, any>>(
    array1: T[],
    array2: T[],
    key: keyof T
): { items: T[]; namesMap: Record<string, any> } => {
    // Combine both arrays
    const combined = [...array1, ...array2];

    // Create a map to store unique items based on the dynamic key
    const uniqueItemsMap = new Map<any, T>();

    // Create an object to store the names
    const namesObject: Record<string, any> = {};

    // Iterate over the combined array
    for (const item of combined) {
        // Add the item to the map if the key is unique
        uniqueItemsMap.set(item[key], item);

        // Collect names into the namesObject
        if (item[key]) {
            namesObject[item[key]] = item;
        }
    }

    // Convert the map back to an array
    const itemsArray = Array.from(uniqueItemsMap.values());

    // Return the items array and the names object
    return { items: itemsArray, namesMap: namesObject };
};
export const formatString = (name: string) =>
    name
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .replace(/\B\w/g, (char) => char.toLowerCase());

interface ColorConfig {
    baseColor: string;
    strokeColor?: string;
    highlightColor: string;
    shade?: number;
}

interface RGB {
    r: number;
    g: number;
    b: number;
}
export function modifySvgColors(
    svgString: string,
    { baseColor, strokeColor, highlightColor, shade = 0 }: ColorConfig
): string {
    // return svgString;
    // Helper function to convert hex to RGB
    // const hexToRgb = (hex: string): RGB => {
    //     const cleanHex = hex.replace("#", "");
    //     return {
    //         r: parseInt(cleanHex.substring(0, 2), 16),
    //         g: parseInt(cleanHex.substring(2, 4), 16),
    //         b: parseInt(cleanHex.substring(4, 6), 16)
    //     };
    // };

    // // Helper function to convert RGB to hex
    // const rgbToHex = (rgb: RGB): string => {
    //     const toHex = (n: number): string => {
    //         const hex = Math.min(255, Math.max(0, n)).toString(16);
    //         return hex.length === 1 ? "0" + hex : hex;
    //     };
    //     return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    // };

    // // Helper function to adjust color brightness
    // const adjustColorShade = (color: string, shadeAmount: number): string => {
    //     const rgb = hexToRgb(color);
    //     const adjustment = Math.floor(shadeAmount * 255);

    //     const adjustedRgb: RGB = {
    //         r: rgb.r + adjustment,
    //         g: rgb.g + adjustment,
    //         b: rgb.b + adjustment
    //     };

    //     return rgbToHex(adjustedRgb);
    // };

    // // Validate hex color format
    // const isValidHexColor = (color: string): boolean => {
    //     return /^#[0-9A-Fa-f]{6}$/.test(color);
    // };

    // // Validate inputs
    // if (
    //     !isValidHexColor(baseColor) ||
    //     !isValidHexColor(highlightColor) ||
    //     (strokeColor && !isValidHexColor(strokeColor))
    // ) {
    //     throw new Error(
    //         "Invalid hex color format. Colors must be in #RRGGBB format."
    //     );
    // }

    // // Validate and clamp shade value
    // const validShade = Math.max(-1, Math.min(1, shade));

    // // Adjust colors based on shade
    // const adjustedBaseColor = adjustColorShade(baseColor, validShade);
    // const adjustedHighlightColor = adjustColorShade(highlightColor, validShade);
    // const adjustedStrokeColor = strokeColor
    //     ? adjustColorShade(strokeColor, validShade)
    //     : null;

    // // Create a DOM parser to work with the SVG string
    // const parser = new DOMParser();
    // const serializer = new XMLSerializer();
    // const doc = parser.parseFromString(svgString, "image/svg+xml");

    // // Check for parsing errors
    // const parserError = doc.querySelector("parsererror");
    // if (parserError) {
    //     throw new Error("Invalid SVG string");
    // }

    // type SVGElement = Element & {
    //     getAttribute(name: string): string | null;
    //     setAttribute(name: string, value: string): void;
    // };

    // // Function to update element styles
    // const updateElementStyles = (element: SVGElement): void => {
    //     // Update fill color if it exists and isn't 'none'
    //     const currentFill = element.getAttribute("fill");
    //     if (currentFill && currentFill !== "none") {
    //         // If it's the highlight color (usually for attach-point), use highlight color
    //         if (currentFill.toLowerCase() === "#ff0000") {
    //             element.setAttribute("fill", adjustedHighlightColor);
    //         } else {
    //             // Otherwise use the base color
    //             element.setAttribute("fill", adjustedBaseColor);
    //         }
    //     }

    //     // Update stroke if strokeColor is provided
    //     const currentStroke = element.getAttribute("stroke");
    //     if (adjustedStrokeColor && currentStroke && currentStroke !== "none") {
    //         element.setAttribute("stroke", adjustedStrokeColor);
    //     }

    //     // If stroke wasn't set but strokeColor is provided, add it
    //     if (adjustedStrokeColor && !currentStroke) {
    //         element.setAttribute("stroke", adjustedStrokeColor);
    //     }

    //     // Update style attribute if it exists
    //     const style = element.getAttribute("style");
    //     if (style) {
    //         let newStyle = style;
    //         if (style.includes("fill:")) {
    //             // Replace fill color in style attribute
    //             if (style.includes("fill:#ff0000")) {
    //                 newStyle = newStyle.replace(
    //                     /fill:#[a-fA-F0-9]{3,6}/,
    //                     `fill:${adjustedHighlightColor}`
    //                 );
    //             } else {
    //                 newStyle = newStyle.replace(
    //                     /fill:#[a-fA-F0-9]{3,6}/,
    //                     `fill:${adjustedBaseColor}`
    //                 );
    //             }
    //         }
    //         if (adjustedStrokeColor && style.includes("stroke:")) {
    //             // Replace stroke color in style attribute
    //             newStyle = newStyle.replace(
    //                 /stroke:#[a-fA-F0-9]{3,6}/,
    //                 `stroke:${adjustedStrokeColor}`
    //             );
    //         }
    //         element.setAttribute("style", newStyle);
    //     }
    // };

    // // Update all shape elements
    // ["path", "circle", "rect", "polygon", "ellipse"].forEach((selector) => {
    //     doc.querySelectorAll(selector).forEach((element) => {
    //         updateElementStyles(element as SVGElement);
    //     });
    // });

    // // Convert back to string
    // let modifiedSvg = serializer.serializeToString(doc);

    // // Clean up any potential XML declaration
    // modifiedSvg = modifiedSvg.replace(/<\?xml[^>]*\?>/, "");

    // return modifiedSvg;
    return svgString;
}
