import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DiagramComponent } from './Types';
import { Button } from './components/ui/Button';
import { calculateBoundingBox } from './lib/svgUtils';
import { getClosestAttachmentPoint } from './lib/diagramComponentsLib';

interface SVGDisplayProps {
    svgContent: string;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
    isCopied: boolean;
    onSelect3DShape: (id: string | null) => void;
    onGetBoundingBox: (boundingBox: { x: number, y: number, width: number, height: number } | null) => void;
    canvasSize: { width: number; height: number };
    setSelectedPosition: (position: string) => void;
    setSelectedAttachmentPoint: (point: string) => void;
}

const SVGDisplay: React.FC<SVGDisplayProps> = ({
    svgContent,
    selected3DShape,
    diagramComponents,
    isCopied,
    onSelect3DShape,
    onGetBoundingBox,
    canvasSize,
    setSelectedPosition,
    setSelectedAttachmentPoint,
}) => {
    const [scale, setScale] = useState(1);
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: canvasSize.width, height: canvasSize.height });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [boundingBox, setBoundingBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Update viewBox when canvasSize changes
        setViewBox({ x: 0, y: 0, width: canvasSize.width, height: canvasSize.height });
    }, [canvasSize]);

    const calculateAndSetBoundingBox = useCallback(() => {
        if (svgRef.current) {
            const boundingBox = calculateBoundingBox(svgRef.current);
            onGetBoundingBox(boundingBox);
        }
    }, [onGetBoundingBox]);

    useEffect(() => {
        // We need to wait for the next frame to ensure the SVG content has been rendered
        requestAnimationFrame(() => {
            calculateAndSetBoundingBox();
        });
    }, [svgContent, calculateAndSetBoundingBox]);

    useEffect(() => {
        const fitSvgToContainer = () => {
            if (svgRef.current && containerRef.current) {
                const svg = svgRef.current;
                const container = containerRef.current;
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                const svgAspectRatio = viewBox.width / viewBox.height;
                const containerAspectRatio = containerWidth / containerHeight;

                let newWidth, newHeight;
                if (containerAspectRatio > svgAspectRatio) {
                    newHeight = containerHeight;
                    newWidth = newHeight * svgAspectRatio;
                } else {
                    newWidth = containerWidth;
                    newHeight = newWidth / svgAspectRatio;
                }

                svg.setAttribute('width', `${containerWidth}px`);
                svg.setAttribute('height', `${containerHeight}px`);
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

                setScale(newWidth / viewBox.width);
            }
        };

        fitSvgToContainer();
        window.addEventListener('resize', fitSvgToContainer);

        return () => {
            window.removeEventListener('resize', fitSvgToContainer);
        };
    }, [svgContent, viewBox]);

    useEffect(() => {
        console.log(`SVG Display: selected 3D shape ${selected3DShape}`);
        if (svgRef.current) {
            const svg = svgRef.current;

            // Remove all highlights
            svg.querySelectorAll('.highlighted-shape').forEach(el => {
                el.classList.remove('highlighted-shape');
            });

            // Add highlight to the selected element if there is one
            if (selected3DShape) {
                const selectedElement = svg.getElementById(selected3DShape);
                if (selectedElement) {
                    selectedElement.classList.add('highlighted-shape');
                }
            }

            // Apply reduced opacity to cut objects
            diagramComponents.forEach(component => {
                const element = svg.getElementById(component.id);
                if (element instanceof SVGElement) {
                    element.style.opacity = component.cut ? ( isCopied ? '0.75': '0.5') : '1';
                }
            });
        }
    }, [selected3DShape, diagramComponents, svgContent]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragging && svgRef.current) {
            const dx = (e.clientX - dragStart.x) / scale;
            const dy = (e.clientY - dragStart.y) / scale;

            setViewBox(prevViewBox => ({
                ...prevViewBox,
                x: prevViewBox.x - dx,
                y: prevViewBox.y - dy
            }));

            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    const handleZoom = (factor: number) => {
        if (svgRef.current) {
            const newScale = Math.max(0.1, Math.min(scale * factor, 10));
            const scaleFactor = newScale / scale;

            setScale(newScale);
            setViewBox(prevViewBox => {
                const centerX = prevViewBox.x + prevViewBox.width / 2;
                const centerY = prevViewBox.y + prevViewBox.height / 2;
                const newWidth = prevViewBox.width / scaleFactor;
                const newHeight = prevViewBox.height / scaleFactor;
                return {
                    x: centerX - newWidth / 2,
                    y: centerY - newHeight / 2,
                    width: newWidth,
                    height: newHeight
                };
            });
        }
    };

    const resetZoom = () => {
        if (svgRef.current) {
            setScale(1);
            setViewBox({ x: 0, y: 0, width: canvasSize.width, height: canvasSize.height });
        }
    };

    const handleShapeClick = (e: React.MouseEvent) => {
        const target = e.target as SVGElement;
        const shape3D = target.closest('[id^="shape-"]');
        if (shape3D) {
            const shapeId = shape3D.id;
            const component = diagramComponents.find(c => c.id === shapeId);

            onSelect3DShape(shapeId);

            if (component) {
                const svgRect = shape3D.getBoundingClientRect();
                if (svgRect) {
                    const clickX = (e.clientX - svgRect.left) / scale;
                    const clickY = (e.clientY - svgRect.top) / scale;
                    console.log(` click : ${clickX},${clickY}`);
                    console.log(svgRect);

                    const { position, attachmentPoint } = getClosestAttachmentPoint(clickX, clickY, component);
                    setSelectedPosition(position);
                    setSelectedAttachmentPoint(attachmentPoint);
                }
            }
        } else {
            onSelect3DShape(null);
            setSelectedPosition('top');
            setSelectedAttachmentPoint('none');
        }
    };

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-gray-100 border border-gray-300">
            <svg
                ref={svgRef}
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute bg-white"
                dangerouslySetInnerHTML={{ __html: svgContent }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleShapeClick}
            />
            <div className="absolute bottom-4 right-4 flex space-x-2">
                <Button onClick={() => handleZoom(1.2)} className="bg-gray-800 text-white px-2 py-1 text-sm rounded">
                    +
                </Button>
                <Button onClick={() => handleZoom(0.8)} className="bg-gray-800 text-white px-2 py-1 text-sm rounded">
                    -
                </Button>
                <Button onClick={resetZoom} className="bg-gray-800 text-white px-2 py-1 text-sm rounded">
                    Reset
                </Button>
            </div>
            <style>
                {`
              .highlighted-shape {
                outline: 2px dashed #007bff;
                outline-offset: 2px;
                }
            .copied-shape {
                outline: 2px dashed #10b981; /* green */
                outline-offset: 2px;
                }
            `}
            </style>
        </div>
    );
};

export default SVGDisplay;