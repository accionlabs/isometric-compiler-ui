// @/lib/connectionPointUtils.ts

import { Position } from '@xyflow/react';
import type { DiagramComponent, AttachmentPoint } from '../Types';

export interface ConnectionPoint {
    id: string;
    position: Position;
    x: number;
    y: number;
    parentId: string;
    attachmentPointId: string;
}

export const calculateConnectionPoints = (
    diagramComponents: DiagramComponent[],
    canvasSize: { width: number; height: number },
    svgViewBox: { x: number; y: number; width: number; height: number } | null
): ConnectionPoint[] => {
    if (!svgViewBox) return [];

    const points: ConnectionPoint[] = [];
    
    // Calculate scaling factors
    const scaleX = canvasSize.width / svgViewBox.width;
    const scaleY = canvasSize.height / svgViewBox.height;

    diagramComponents.forEach(component => {
        component.attachmentPoints?.forEach((ap: AttachmentPoint) => {
            // Transform SVG coordinates to canvas coordinates
            const transformedX = (ap.x - svgViewBox.x) * scaleX;
            const transformedY = (ap.y - svgViewBox.y) * scaleY;

            // Calculate relative position from component center
            const componentCenterX = component.absolutePosition ?
                (component.absolutePosition.x - svgViewBox.x) * scaleX + (canvasSize.width / 2)
                : canvasSize.width/2;
            const isLeftSide = transformedX < componentCenterX;

            points.push({
                id: `${component.id}-${ap.name}`,
                position: isLeftSide ? Position.Left : Position.Right,
                x: transformedX,
                y: transformedY,
                parentId: component.id,
                attachmentPointId: ap.name
            });
        });
    });

    return points;
};

export const getConnectionPointsForShape = (
    shapeId: string,
    connectionPoints: ConnectionPoint[]
): ConnectionPoint[] => {
    return connectionPoints.filter(point => point.parentId === shapeId);
};

export const validateConnection = (
    connection: { source: string; target: string; sourceHandle?: string; targetHandle?: string },
    connectionPoints: ConnectionPoint[]
): boolean => {
    // Add validation logic here
    // For example, prevent connecting two label nodes, or enforce specific connection rules
    return true;
};

export const createConnectionPointId = (
    componentId: string,
    attachmentPointName: string,
    index: number
): string => {
    return `${componentId}-${attachmentPointName}-${index}`;
};