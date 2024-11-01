import React, { useState, useCallback } from 'react';
import {
    EdgeProps,
    EdgeLabelRenderer,
    getBezierPath
} from 'reactflow';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface CustomEdgeProps extends EdgeProps {
    data?: {
        label?: string;
    };
}

const CustomEdge: React.FC<CustomEdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const onEdgeClick = useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
        evt.stopPropagation();
        // You can trigger edge removal here if needed
        // For example, by calling a prop function like onEdgeRemove(id)
    }, [id]);

    return (
        <>
            <path
                id={id}
                className="react-flow__edge-path"
                d={edgePath}
                strokeWidth={2}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: isHovered ? '#3730a3' : '#555',
                    strokeDasharray: '5,5',
                    animation: 'dashedEdge 20s linear infinite',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            />
            {isHovered && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                            background: 'white',
                            padding: 4,
                            borderRadius: 4,
                            fontSize: 12,
                            zIndex: 10,
                        }}
                        className="nodrag nopan shadow-md border border-gray-200"
                    >
                        <Button
                            className="p-1 hover:bg-red-100 text-red-600 h-6 w-6 flex items-center justify-center"
                            onClick={onEdgeClick}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </EdgeLabelRenderer>
            )}
            {data?.label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'none',
                            fontSize: 12,
                        }}
                        className="bg-white px-2 py-1 rounded shadow-sm border border-gray-200"
                    >
                        {data.label}
                    </div>
                </EdgeLabelRenderer>
            )}
            <style>
                {`
                    @keyframes dashedEdge {
                        from {
                            stroke-dashoffset: 10;
                        }
                        to {
                            stroke-dashoffset: 0;
                        }
                    }
                `}
            </style>
        </>
    );
};

export default React.memo(CustomEdge);