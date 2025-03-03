import { CanvasSettings } from "./Types";

export const CUSTOM_SCROLLBAR =
    "scroll-container overflow-auto scrollbar-thin scrollbar-thumb-customLightGray scrollbar-track-transparent";

export const DEFAULT_SETTINGS: CanvasSettings = {
    canvas: {
        canvasSize: {
            width: 1000,
            height: 1000
        },
        showAttachmentPoints: false
    },
    metadataLabel: {
        minSpacing: 200,
        minYSpacing: 17,
        smoothingAngle: (120 * Math.PI) / 180, // 120 degrees in radians
        stepSize: 20
    },
    layerLabel: {
        width: 200,
        lineSpacing: 1.2,
        fontFamily: "sans-serif",
        fontSize: 60,
        fontWeight: "bold"
    }
};
