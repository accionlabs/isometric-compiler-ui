import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, useStore, ReactFlowState } from 'reactflow';
import { DiagramComponent, Point } from '@/Types';
import { getClosestAttachmentPoint, extractGlobalAttachmentPoints } from '@/lib/diagramComponentsLib';
import { calculateSVGBoundingBox, calculateViewBox, DEFAULT_MARGIN } from '@/lib/svgUtils';

interface SVGNodeData {
    svgContent: string;
    diagramComponents: DiagramComponent[];
    selected3DShape: string | null;
    onSelect3DShape: (id: string | null) => void;
    setSelectedPosition: (position: string) => void;
    setSelectedAttachmentPoint: (point: string) => void;
}

interface HandlePosition {
    id: string;
    position: Position;
    x: number;
    y: number;
    componentId: string;
    pointName: string;
}

const SVGNode = ({ data }: NodeProps<SVGNodeData>) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [handles, setHandles] = useState<HandlePosition[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Store SVG layout information
    const [viewBox, setViewBox] = useState({
        x: 0,
        y: 0,
        width: 1000,
        height: 1000
    });
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Get viewport transform from React Flow store
    const transform = useStore((state: ReactFlowState) => state.transform);
    const zoom = transform[2];

    // Calculate SVG layout parameters based on current container and zoom
    const calculateSvgLayout = useCallback(() => {
        if (!containerRef.current || !svgRef.current) return;

        // Get the current SVG bounding box
        const boundingBox = svgRef.current.getBBox();
        const newViewBox = calculateViewBox(boundingBox, DEFAULT_MARGIN);

        // Get the container size (accounting for zoom)
        const container = containerRef.current.getBoundingClientRect();
        const containerWidth = container.width / zoom;
        const containerHeight = container.height / zoom;

        // Calculate new scale to fit the container
        const newScale = Math.min(
            containerWidth / newViewBox.width,
            containerHeight / newViewBox.height
        );

        // Calculate new offset to center the content
        const newOffset = {
            x: (containerWidth - newViewBox.width * newScale) / 2,
            y: (containerHeight - newViewBox.height * newScale) / 2
        };

        return { viewBox: newViewBox, scale: newScale, offset: newOffset };
    }, [zoom]);

    // Update layout when container size or zoom changes
    useEffect(() => {
        const layout = calculateSvgLayout();
        if (layout) {
            setViewBox(layout.viewBox);
            setScale(layout.scale);
            setOffset(layout.offset);
        }
    }, [dimensions, zoom, calculateSvgLayout]);

    // Measure container size
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Initial SVG render
    useEffect(() => {
        if (!containerRef.current || !dimensions.width || !dimensions.height) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.innerHTML = data.svgContent;
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('class', 'svg-content');
        svg.setAttribute('style', 'display: block;');

        const svgWrapper = containerRef.current.querySelector('.svg-wrapper');
        if (svgWrapper) {
            svgWrapper.innerHTML = '';
            svgWrapper.appendChild(svg);
            svgRef.current = svg;

            // Initial layout calculation
            const layout = calculateSvgLayout();
            if (layout) {
                svg.setAttribute('viewBox',
                    `${layout.viewBox.x} ${layout.viewBox.y} ${layout.viewBox.width} ${layout.viewBox.height}`
                );
                setViewBox(layout.viewBox);
                setScale(layout.scale);
                setOffset(layout.offset);
            }

            requestAnimationFrame(() => setIsReady(true));
        }

        return () => {
            setIsReady(false);
            if (svgWrapper) {
                svgWrapper.innerHTML = '';
            }
        };
    }, [data.svgContent, dimensions]);

    // Calculate handle positions
    useEffect(() => {
        if (!isReady || !svgRef.current || !containerRef.current) return;

        const globalPoints = extractGlobalAttachmentPoints(data.diagramComponents);
        const newHandles: HandlePosition[] = [];

        globalPoints.forEach(component => {
            component.attachmentPoints.forEach(point => {
                if (['attach-front-left', 'attach-front-right'].includes(point.name)) {
                    // Convert from SVG coordinates to container space
                    const x = ((point.x - viewBox.x) * scale + offset.x);
                    const y = ((point.y - viewBox.y) * scale + offset.y);

                    newHandles.push({
                        id: `${component.componentId}-${point.name}`,
                        position: Position.Left,
                        x,
                        y,
                        componentId: component.componentId,
                        pointName: point.name
                    });
                }
            });
        });

        setHandles(newHandles);
    }, [isReady, data.diagramComponents, scale, offset, viewBox]);

    // Convert container coordinates to SVG coordinates
    const containerToSvgCoords = useCallback((containerX: number, containerY: number): Point => {
        const svgX = (containerX - offset.x) / scale + viewBox.x;
        const svgY = (containerY - offset.y) / scale + viewBox.y;
        return { x: svgX, y: svgY };
    }, [viewBox, scale, offset]);

    // Handle click events on the SVG
    const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        if (!svgRef.current || !containerRef.current) return;

        const target = event.target as SVGElement;
        const shape3D = target.closest('[id^="shape-"]');

        if (shape3D) {
            const shapeId = shape3D.id;
            const component = data.diagramComponents.find(c => c.id === shapeId);
            data.onSelect3DShape(shapeId);

            if (component) {
                // Get click coordinates relative to container
                const containerRect = containerRef.current.getBoundingClientRect();
                const containerX = (event.clientX - containerRect.left) / zoom;
                const containerY = (event.clientY - containerRect.top) / zoom;

                // Convert to SVG coordinates
                const svgCoords = containerToSvgCoords(containerX, containerY);

                // Get closest attachment point
                const { position, attachmentPoint } = getClosestAttachmentPoint(
                    svgCoords.x - component.absolutePosition.x,
                    svgCoords.y - component.absolutePosition.y,
                    component
                );

                data.setSelectedPosition(position);
                data.setSelectedAttachmentPoint(attachmentPoint);
            }

            // Update highlighting
            svgRef.current.querySelectorAll('.highlighted-shape').forEach(el => {
                el.classList.remove('highlighted-shape');
            });
            shape3D.classList.add('highlighted-shape');
        } else {
            // Clear selection
            data.onSelect3DShape(null);
            data.setSelectedPosition('top');
            data.setSelectedAttachmentPoint('none');

            // Remove highlighting
            svgRef.current.querySelectorAll('.highlighted-shape').forEach(el => {
                el.classList.remove('highlighted-shape');
            });
        }
    }, [data, containerToSvgCoords, zoom]);

    return (
        <div
            className="react-flow-svg-node"
            ref={containerRef}
            style={{ width: '100%', height: '100%', minHeight: '200px', minWidth: '200px' }}
        >
            <div
                className="svg-wrapper"
                onClick={handleClick}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    zIndex: -1,
                    pointerEvents: 'auto'
                }}
            />

            {handles.map((handle) => (
                <Handle
                    key={handle.id}
                    type="target"
                    position={handle.position}
                    id={handle.id}
                    className="handle-point"
                    style={{
                        position: 'absolute',
                        left: `${handle.x}px`,
                        top: `${handle.y}px`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                    }}
                />
            ))}

            <style>
                {`
                    .react-flow-svg-node {
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .svg-wrapper {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                    }
                    .svg-content {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                    }
                    .handle-point {
                        width: 8px;
                        height: 8px;
                        background: #4F46E5;
                        border: 2px solid white;
                    }
                    .highlighted-shape {
                        outline: 2px dashed #007bff;
                        outline-offset: 2px;
                    }
                `}
            </style>
        </div>
    );
};

export default React.memo(SVGNode);