import React, { useRef, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { calculateBoundingBox } from '@/lib/svgUtils';
import { getClosestAttachmentPoint } from '@/lib/diagramComponentsLib';
import { DiagramComponent } from '@/Types';

interface SVGNodeData {
    svgContent: string;
    attachmentPoints: Array<{
        id: string;
        x: number;
        y: number;
        side: 'left' | 'right';
    }>;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
    isCopied: boolean;
    onSelect3DShape: (id: string | null) => void;
    setSelectedPosition: (position: string) => void;
    setSelectedAttachmentPoint: (point: string) => void;
}

const BOUNDING_BOX_MARGIN = 10;

const SVGNode = ({ data }: NodeProps<SVGNodeData>) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            const boundingBox = calculateBoundingBox(svgRef.current);
            if (boundingBox) {
                const marginedBox = {
                    x: boundingBox.x - BOUNDING_BOX_MARGIN,
                    y: boundingBox.y - BOUNDING_BOX_MARGIN,
                    width: boundingBox.width + (BOUNDING_BOX_MARGIN * 2),
                    height: boundingBox.height + (BOUNDING_BOX_MARGIN * 2)
                };

                svgRef.current.setAttribute('width', `${marginedBox.width}px`);
                svgRef.current.setAttribute('height', `${marginedBox.height}px`);
                svgRef.current.setAttribute('viewBox', 
                    `${marginedBox.x} ${marginedBox.y} ${marginedBox.width} ${marginedBox.height}`
                );
            }
        }
    }, [data.svgContent]);

    useEffect(() => {
        if (svgRef.current) {
            svgRef.current.querySelectorAll('[id^="shape-"]').forEach(el => {
                el.classList.remove('highlighted-shape');
                (el as SVGElement).style.opacity = '1';
            });

            if (data.selected3DShape) {
                const selectedElement = svgRef.current.querySelector(`#${data.selected3DShape}`);
                if (selectedElement) {
                    selectedElement.classList.add('highlighted-shape');
                }
            }

            data.diagramComponents.forEach(component => {
                if (component.cut) {
                    const element = svgRef.current?.querySelector(`#${component.id}`);
                    if (element instanceof SVGElement) {
                        element.style.opacity = data.isCopied ? '0.75' : '0.5';
                    }
                }
            });
        }
    }, [data.selected3DShape, data.diagramComponents, data.isCopied]);

    const handleClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        const target = event.target as SVGElement;
        const shape3D = target.closest('[id^="shape-"]');
        
        if (shape3D && svgRef.current) {
            const shapeId = shape3D.id;
            const component = data.diagramComponents.find(c => c.id === shapeId);

            if (component) {
                // Get the CTM (Current Transform Matrix) of the shape
                const ctm = (shape3D as SVGGraphicsElement).getScreenCTM();
                if (ctm) {
                    // Create an SVG point with the click coordinates
                    const point = svgRef.current.createSVGPoint();
                    point.x = event.clientX;
                    point.y = event.clientY;

                    // Transform point from screen coordinates to SVG coordinates
                    const svgPoint = point.matrixTransform(ctm.inverse());
                    
                    console.log('Click coordinates:', { 
                        screen: { x: event.clientX, y: event.clientY },
                        svg: { x: svgPoint.x, y: svgPoint.y }
                    });

                    const { position, attachmentPoint } = getClosestAttachmentPoint(
                        svgPoint.x,
                        svgPoint.y,
                        component
                    );

                    data.setSelectedPosition(position);
                    data.setSelectedAttachmentPoint(attachmentPoint);
                    data.onSelect3DShape(shapeId);
                }
            }
        } else {
            data.onSelect3DShape(null);
            data.setSelectedPosition('top');
            data.setSelectedAttachmentPoint('none');
        }
    }, [data.diagramComponents, data.onSelect3DShape, data.setSelectedPosition, data.setSelectedAttachmentPoint]);

    const createHandleStyle = useCallback((x: number, y: number) => ({
        left: `${x}%`,
        top: `${y}%`,
        position: 'absolute' as const,
        transform: 'translate(-50%, -50%)',
        zIndex: 1
    }), []);

    return (
        <div 
            ref={containerRef} 
            className="react-flow-svg-node"
            style={{ zIndex: 0 }}
        >
            <div className="svg-wrapper">
                <svg
                    ref={svgRef}
                    dangerouslySetInnerHTML={{ __html: data.svgContent }}
                    onClick={handleClick}
                />
            </div>

            {data.attachmentPoints.map((point, index) => (
                <Handle
                    key={`${point.id}-${index}`}
                    type="target"
                    position={point.side === 'left' ? Position.Left : Position.Right}
                    id={`${point.side}-${index}`}
                    style={createHandleStyle(point.x, point.y)}
                />
            ))}

            <style>
                {`
                    .react-flow-svg-node {
                        position: relative;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .svg-wrapper {
                        width: 100%;
                        height: 100%;
                    }
                    .svg-wrapper svg {
                        width: 100%;
                        height: 100%;
                    }
                    .highlighted-shape {
                        outline: 2px dashed #007bff;
                        outline-offset: 2px;
                    }
                    .copied-shape {
                        outline: 2px dashed #10b981;
                        outline-offset: 2px;
                    }
                `}
            </style>
        </div>
    );
};

export default React.memo(SVGNode);