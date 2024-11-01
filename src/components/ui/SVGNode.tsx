import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, useStore, ReactFlowState } from 'reactflow';
import { Point, CanvasSize, DiagramComponent, GlobalAttachmentPoint, TransformationContext, ViewBox, AttachmentPoint } from '@/Types';
import { getClosestAttachmentPoint } from '@/lib/diagramComponentsLib';
import {
    calculateSVGBoundingBox,
    calculateScale,
    calculateViewBox,
    DEFAULT_MARGIN
} from '@/lib/svgUtils';

interface SVGNodeData {
    svgContent: string;
    attachmentPoints: GlobalAttachmentPoint[];
    diagramComponents: DiagramComponent[];
    canvasSize: CanvasSize;
    selected3DShape: string | null;
    transformationContext: TransformationContext;
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
    const [svgScale, setSVGScale] = useState<number>(1.0);
    const [svgViewBox, setSVGViewBox] = useState<ViewBox>({
        x: 0,
        y: 0,
        width: 1000,
        height: 1000
    });

    // Get viewport zoom from React Flow store
    const zoom = useStore((store: ReactFlowState) => store.transform[2]);

    // Function to adjust coordinates based on viewBox
    const adjustToViewBox = useCallback((point: { x: number, y: number }) => {
        return {
            x: (point.x - svgViewBox.x) / svgScale,
            y: (point.y - svgViewBox.y) / svgScale
        };
    }, [dimensions]);

    // Function to revert coordinates from viewBox-adjusted space
    const revertFromViewBox = useCallback((point: { x: number, y: number }) => {
        return {
            x: (point.x * svgScale) + svgViewBox.x,
            y: (point.y * svgScale) + svgViewBox.y
        };
    }, [dimensions]);

    // Function to translate SVG coordinates to container-relative coordinates
    const svgToContainer = useCallback((point: { x: number, y: number }) => {
        if (!containerRef.current || !svgRef.current || !svgViewBox) return null;

        // First adjust the coordinates based on viewBox
        const adjustedPoint = adjustToViewBox(point);

        // Get container's bounding rect for relative positioning
        const containerRect = containerRef.current.getBoundingClientRect();
        const scale = Math.min(
            (containerRect.width / svgViewBox.width),
            (containerRect.height / svgViewBox.height)
        );

        // Return container-relative coordinates
        return {
            x: adjustedPoint.x * scale - containerRect.x,
            y: adjustedPoint.y * scale - containerRect.y
        };
    }, [adjustToViewBox, svgViewBox, svgScale]);

    // Function to translate container-relative coordinates to SVG coordinates
    const containerToSvg = useCallback((x: number, y: number) => {
        if (!containerRef.current || !svgRef.current || !svgViewBox) return null;

        // First get the point in viewBox-adjusted coordinates
        const point = { x, y };

        // Get container's bounding rect for relative positioning
        const containerRect = containerRef.current.getBoundingClientRect();
        const scale = Math.min(
            (containerRect.width / svgViewBox.width),
            (containerRect.height / svgViewBox.height)
        );
        const svgPoint = {
            x: point.x / scale + containerRect.x,
            y: point.y / scale + containerRect.y
        };
        // Then revert the viewBox transformation
        return revertFromViewBox(svgPoint);
    }, [revertFromViewBox, svgViewBox, svgScale]);

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

        // Create SVG element
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
            requestAnimationFrame(() => setIsReady(true));
        }

        return () => {
            setIsReady(false);
            if (svgWrapper) {
                svgWrapper.innerHTML = '';
            }
        };
    }, [data.svgContent, dimensions]);

    // Calculate handle positions using getBoundingClientRect
    useEffect(() => {
        if (!isReady || !svgRef.current || !containerRef.current) return;

        // calculate SVG Bounding Box
        //const boundingBox = calculateSVGBoundingBox(data.svgContent, data.canvasSize);
        const boundingBox = svgRef.current.getBBox();
        const viewBox = calculateViewBox(boundingBox, DEFAULT_MARGIN);

        const { x, y, width, height } = viewBox;
        svgRef.current.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

        const container = containerRef.current.getBoundingClientRect();
        console.log('container:', container);

        const svg = svgRef.current.getBoundingClientRect();
        console.log('svg:', svg);

        // convert attachment point coordinates from svg to container
        const adjustMadi = 1; // arbitrary factor to get the points to align... no idea why its required
        const scale = Math.min(
            Math.round(container.width) / Math.round(viewBox.width),
            Math.round(container.height) / Math.round(viewBox.height)
        ) * adjustMadi;

        // svg is vertically and horizontally centered in container... calculate offset
        const offset = {
            x: Math.round((container.width - viewBox.width * scale) / 2),
            y: Math.round((container.height - viewBox.height * scale) / 2)
        }

        console.log('scale:', scale, 'zoom', zoom, 'viewBox', viewBox, 'offset:', offset);
        const adjustedPoints:{
            name: string;
            id: string;
            componentId:string;
            x: number;
            y: number;
        }[] = [];

        data.attachmentPoints.forEach(component => {
            component.attachmentPoints.forEach(point => {
                if (['attach-front-left', 'attach-front-right'].includes(point.name)) {
                    console.log('attachment point:',point);
                    adjustedPoints.push({
                        name: point.name,
                        id: `${component.componentId}-${point.name}`,
                        componentId: component.componentId,
                        x: Math.round((((point.x - viewBox.x) * scale) + offset.x) / zoom),
                        y: Math.round((((point.y - viewBox.y) * scale) + offset.y) / zoom),
                    })
                }
            })    
        })

        console.log('adjusted points:', adjustedPoints);

        const newHandles: HandlePosition[] = adjustedPoints.map(point => {
            return {
                id: point.id,
                position: Position.Left,
                x: Math.round(point.x),
                y: Math.round(point.y),
                componentId: point.componentId,
                pointName: point.name
            };
        })

        console.log('Calculated handle positions:', newHandles);
        setHandles(newHandles);
    }, [isReady]);

    const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        if (!svgRef.current || !containerRef.current || !data.transformationContext?.viewBox) return;

        const target = event.target as SVGElement;
        const shape3D = target.closest('[id^="shape-"]');


        if (shape3D) {
            const shapeId = shape3D.id;
            data.onSelect3DShape(shapeId);

            console.log(`SVG Node click ${shapeId} at ${event.clientX}, ${event.clientY}`);

            // Get container-relative coordinates
            const containerRect = containerRef.current.getBoundingClientRect();
            const x = event.clientX;
            const y = event.clientY;

            // Use existing coordinate transformation
            const svgPoint = containerToSvg(x, y);

            if (svgPoint) {
                console.log(` -> container ${x},${y} -> svg ${svgPoint.x},${svgPoint.y}`);
                const component = data.diagramComponents.find(c => c.id === shapeId);
                if (component) {
                    const { position, attachmentPoint } = getClosestAttachmentPoint(
                        svgPoint.x - component.absolutePosition.x,
                        svgPoint.y - component.absolutePosition.y,
                        component
                    );
                    console.log(` --> closest point ${position} ${attachmentPoint}`);
                    data.setSelectedPosition(position);
                    data.setSelectedAttachmentPoint(attachmentPoint);
                }
            }

            // Update highlighting
            svgRef.current.querySelectorAll('.highlighted-shape').forEach(el => {
                el.classList.remove('highlighted-shape');
            });
            shape3D.classList.add('highlighted-shape');
        } else {
            data.onSelect3DShape(null);
            data.setSelectedPosition('top');
            data.setSelectedAttachmentPoint('none');

            // Remove highlighting
            svgRef.current.querySelectorAll('.highlighted-shape').forEach(el => {
                el.classList.remove('highlighted-shape');
            });
        }
    }, [data, data.selected3DShape, containerToSvg, data.transformationContext]);

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
                    pointerEvents: 'auto' // Important: Make sure clicks are captured
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
                        transform: 'translate(-50%,-50%)',
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