import React, { useRef, useCallback, useEffect, useState } from "react";
import {
    Node,
    Handle,
    Position,
    NodeProps,
    useStore,
    ReactFlowState,
    HandleType,
    useUpdateNodeInternals
} from "@xyflow/react";
import { CanvasSize, DiagramComponent, Point } from "@/Types";
import {
    getClosestAttachmentPoint,
    extractGlobalAttachmentPoints
} from "@/lib/diagramComponentsLib";
import {
    calculateSVGBoundingBox,
    calculateViewBox,
    DEFAULT_MARGIN
} from "@/lib/svgUtils";

export interface ComponentBounds {
    id: string;
    center: {
        x: number;
        y: number;
    };
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

// Map of array of all attachment points for a component from its constituent shapes
export interface ComponentBoundsMap {
    [key: string]: ComponentBounds;
}

type SVGNodeData = Node<{
    canvasSize: CanvasSize;
    svgContent: string;
    diagramComponents: DiagramComponent[];
    selected3DShape: string | null;
    onSelect3DShape: (id: string | null) => void;
    setSelectedPosition: (position: string) => void;
    setSelectedAttachmentPoint: (point: string) => void;
    isCopied: boolean;
    isConnecting: boolean;
    isInteractive: boolean;
    onComponentBoundsUpdate?: (bounds: ComponentBoundsMap) => void;
}>;

export interface HandlePosition {
    id: string;
    position: Position;
    type: HandleType;
    x: number;
    y: number;
    componentId: string;
    pointName: string;
}

interface SVGLayout {
    viewBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    scale: number;
    offset: {
        x: number;
        y: number;
    };
}

const styles = {
    container: {
        width: "100%",
        height: "100%",
        minHeight: "200px",
        minWidth: "200px",
        visibility: "visible" as const,
        position: "relative" as const
    },
    svgWrapper: {
        position: "absolute" as const,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "auto" as const,
        visibility: "visible" as const
    },
    handlePoint: {
        position: "absolute" as const,
        width: 8,
        height: 8,
        background: "#4F46E5",
        border: "2px solid white",
        zIndex: 1
    }
} as const;

const SVGNode = ({ id, data }: NodeProps<SVGNodeData>) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [handles, setHandles] = useState<HandlePosition[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const updateNodeInternals = useUpdateNodeInternals();

    const [viewBox, setViewBox] = useState({
        x: 0,
        y: 0,
        width: data.canvasSize.width,
        height: data.canvasSize.height
    });
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const transform = useStore((state: ReactFlowState) => state.transform);
    const zoom = transform[2];

    const calculateSvgLayout = useCallback((): SVGLayout | null => {
        if (!containerRef.current || !svgRef.current) return null;

        const boundingBox = svgRef.current.getBBox();
        const newViewBox = calculateViewBox(boundingBox, DEFAULT_MARGIN);

        const container = containerRef.current.getBoundingClientRect();
        const containerWidth = container.width / zoom;
        const containerHeight = container.height / zoom;

        const newScale = Math.min(
            containerWidth / newViewBox.width,
            containerHeight / newViewBox.height
        );

        const newOffset = {
            x: (containerWidth - newViewBox.width * newScale) / 2,
            y: (containerHeight - newViewBox.height * newScale) / 2
        };

        return { viewBox: newViewBox, scale: newScale, offset: newOffset };
    }, [zoom]);

    const containerToSvgCoords = useCallback(
        (containerX: number, containerY: number): Point => ({
            x: (containerX - offset.x) / scale + viewBox.x,
            y: (containerY - offset.y) / scale + viewBox.y
        }),
        [viewBox, scale, offset]
    );

    const SvgToContainerCoords = useCallback(
        (svgX: number, svgY: number): Point => ({
            x: offset.x + (svgX - viewBox.x) * scale,
            y: offset.y + (svgY - viewBox.y) * scale
        }),
        [viewBox, scale, offset]
    );

    // Calculate component bounds in React Flow coordinates
    const calculateComponentBounds = useCallback(() => {
        if (!svgRef.current || !containerRef.current) return {};

        const componentBoundsMap: ComponentBoundsMap = {};

        const getBounds = (
            component:DiagramComponent | null,
            element:SVGGraphicsElement) => {
            const bbox = element.getBBox();
            if (component && component.absolutePosition) {
                bbox.x = bbox.x + component.absolutePosition.x;
                bbox.y = bbox.y + component.absolutePosition.y;
            }
            const center = SvgToContainerCoords(
                bbox.x + bbox.width / 2,
                bbox.y + bbox.height / 2
            );
            const bounds = SvgToContainerCoords(
                bbox.x,
                bbox.y
            ) as DOMRect;
            bounds.width = bbox.width * scale;
            bounds.height = bbox.height * scale;
            return {
                id:component?component.id : 'root',
                center: center,
                bounds: bounds
            };    
        } 

        const svg = svgRef.current;
        // Get bounding box of the entire svg
        componentBoundsMap['root'] = getBounds(null,svgRef.current);

        // Get bounding box for each component in the diagram
        data.diagramComponents.forEach((component) => {
            const element = svg.getElementById(component.id);

            if (!(element instanceof SVGGraphicsElement)) return;
            componentBoundsMap[component.id] = getBounds(component,element);

        });

        return componentBoundsMap;
    }, [data.diagramComponents, zoom, scale, offset, viewBox]);

    // Update bounds when relevant properties change
    useEffect(() => {
        if (!isReady) return;

        const bounds = calculateComponentBounds();
        //console.log("component bounds:", bounds, data.onComponentBoundsUpdate);
        data.onComponentBoundsUpdate?.(bounds);
    }, [isReady, data.diagramComponents, calculateComponentBounds, data.onComponentBoundsUpdate]);

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = svgRef.current;
        svg.querySelectorAll(".highlighted-shape").forEach((el) => {
            el.classList.remove("highlighted-shape");
        });

        if (data.selected3DShape) {
            const selectedElement = svg.getElementById(data.selected3DShape);
            if (selectedElement) {
                selectedElement.classList.add("highlighted-shape");
            }
        }
    }, [data.selected3DShape]);

    useEffect(() => {
        if (svgRef.current) {
            const svg = svgRef.current;

            // Remove all highlights
            svg.querySelectorAll(".highlighted-shape").forEach((el) => {
                el.classList.remove("highlighted-shape");
            });

            // Add highlight to the selected element if there is one
            if (data.selected3DShape) {
                const selectedElement = svg.getElementById(
                    data.selected3DShape
                );
                if (selectedElement) {
                    selectedElement.classList.add("highlighted-shape");
                }
            }

            // Apply reduced opacity to cut objects
            data.diagramComponents.forEach((component) => {
                const element = svg.getElementById(component.id);
                if (element instanceof SVGElement) {
                    element.style.opacity = component.cut
                        ? data.isCopied
                            ? "0.75"
                            : "0.5"
                        : "1";
                }
            });
        }
    }, [data.selected3DShape, data.diagramComponents, data.svgContent]);

    // Monitor container size
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

    // Initialize SVG content
    useEffect(() => {
        if (!containerRef.current || !dimensions.width || !dimensions.height)
            return;

        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        svg.innerHTML = data.svgContent;
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("class", "svg-content");
        svg.setAttribute("style", "display: block;");

        const svgWrapper = containerRef.current.querySelector(".svg-wrapper");
        if (svgWrapper) {
            svgWrapper.innerHTML = "";
            svgWrapper.appendChild(svg);
            svgRef.current = svg;

            const layout = calculateSvgLayout();
            if (layout) {
                svg.setAttribute(
                    "viewBox",
                    `${layout.viewBox.x} ${layout.viewBox.y} ${layout.viewBox.width} ${layout.viewBox.height}`
                );
                setViewBox(layout.viewBox);
                setScale(layout.scale);
                setOffset(layout.offset);

                requestAnimationFrame(() => setIsReady(true));
            }

            // Apply reduced opacity to cut objects
            data.diagramComponents.forEach((component) => {
                const element = svgRef.current?.getElementById(component.id);
                if (element instanceof SVGElement) {
                    element.style.opacity = component.cut
                        ? data.isCopied
                            ? "0.75"
                            : "0.5"
                        : "1";
                }
            });

            // Add highlight to the selected element if there is one
            if (data.selected3DShape) {
                const selectedElement = svg.getElementById(
                    data.selected3DShape
                );
                if (selectedElement) {
                    selectedElement.classList.add("highlighted-shape");
                }
            }
        }

        return () => {
            if (svgWrapper) {
                svgWrapper.innerHTML = "";
            }
            svgRef.current = null;
            setIsReady(false);
        };
    }, [data.svgContent, dimensions]);

    // Update layout when dimensions or zoom changes
    useEffect(() => {
        if (svgRef.current) {
            const layout = calculateSvgLayout();
            if (layout) {
                svgRef.current.setAttribute(
                    "viewBox",
                    `${layout.viewBox.x} ${layout.viewBox.y} ${layout.viewBox.width} ${layout.viewBox.height}`
                );
                setViewBox(layout.viewBox);
                setScale(layout.scale);
                setOffset(layout.offset);
            }
        }
    }, [dimensions, zoom, calculateSvgLayout]);

    // Calculate handle positions and update node internals
    useEffect(() => {
        if (!isReady || !svgRef.current || !containerRef.current) return;

        //console.log("SVGNode handles:", data.diagramComponents);
        const globalPoints = extractGlobalAttachmentPoints(
            data.diagramComponents
        );
        const newHandles: HandlePosition[] = [];

        globalPoints.forEach((component) => {
            component.attachmentPoints.forEach((point) => {
                if (
                    [
                        "attach-front-left",
                        "attach-front-right",
                        "attach-back-left",
                        "attach-back-right"
                    ].includes(point.name)
                ) {
                    const coords = SvgToContainerCoords(point.x, point.y);
                    const handleId = `${component.componentId}-${point.name}`;

                    newHandles.push({
                        id: handleId,
                        position: point.name.includes("left")
                            ? Position.Left
                            : Position.Right,
                        type: "target",
                        x: coords.x,
                        y: coords.y,
                        componentId: component.componentId,
                        pointName: point.name
                    });
                }
            });
        });

        setHandles(newHandles);
        // Update node internals after setting handles
        updateNodeInternals(id);
    }, [
        isReady,
        data.diagramComponents,
        scale,
        offset,
        viewBox,
        updateNodeInternals,
        id
    ]);

    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            event.stopPropagation();

            // If we're in connecting mode, don't handle shape selection
            if (
                !svgRef.current ||
                !containerRef.current ||
                !data.isInteractive ||
                data.isConnecting
            )
                return;

            const target = event.target as SVGElement;

            // Check if we clicked on a handle
            if (target.closest(".react-flow__handle")) {
                return; // Don't process clicks on handles
            }

            const shape3D = target.closest('[id^="shape-"]');

            if (shape3D) {
                const shapeId = shape3D.id;
                const component = data.diagramComponents.find(
                    (c) => c.id === shapeId
                );
                data.onSelect3DShape(shapeId);

                if (component) {
                    const containerRect =
                        containerRef.current.getBoundingClientRect();
                    const containerX =
                        (event.clientX - containerRect.left) / zoom;
                    const containerY =
                        (event.clientY - containerRect.top) / zoom;

                    const svgCoords = containerToSvgCoords(
                        containerX,
                        containerY
                    );

                    const { position, attachmentPoint } =
                        component.absolutePosition
                            ? getClosestAttachmentPoint(
                                  svgCoords.x - component.absolutePosition.x,
                                  svgCoords.y - component.absolutePosition.y,
                                  component
                              )
                            : { position: "top", attachmentPoint: "none" };

                    data.setSelectedPosition(position);
                    data.setSelectedAttachmentPoint(attachmentPoint);
                }

                svgRef.current
                    .querySelectorAll(".highlighted-shape")
                    .forEach((el) => {
                        el.classList.remove("highlighted-shape");
                    });
                shape3D.classList.add("highlighted-shape");
            } else {
                data.onSelect3DShape(null);
                data.setSelectedPosition("top");
                data.setSelectedAttachmentPoint("none");

                svgRef.current
                    .querySelectorAll(".highlighted-shape")
                    .forEach((el) => {
                        el.classList.remove("highlighted-shape");
                    });
            }
        },
        [data, containerToSvgCoords, zoom]
    );

    return (
        <div
            className="react-flow-svg-node"
            ref={containerRef}
            style={styles.container}
        >
            <div
                className="svg-wrapper"
                onClick={handleClick}
                style={styles.svgWrapper}
            />

            {handles.map((handle) => (
                <Handle
                    key={handle.id}
                    type="target" // Force all handles to be target type only
                    position={handle.position}
                    id={handle.id}
                    className={`handle-point ${
                        data.isConnecting ? "visible" : "invisible"
                    }`}
                    style={{
                        ...styles.handlePoint,
                        left: `${handle.x}px`,
                        top: `${handle.y}px`,
                        transform: "translate(-50%, -50%)",
                        opacity: data.isConnecting ? 1 : 0,
                        pointerEvents: data.isConnecting ? "auto" : "none",
                        transition: "opacity 0.2s ease-in-out"
                    }}
                    isConnectableStart={false} // Prevent starting connections from these handles
                    isConnectableEnd={true} // Only allow ending connections on these handles
                />
            ))}

            <style>
                {`
                    .react-flow-svg-node {
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        visibility: visible !important;
                    }
                    .svg-wrapper {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        visibility: visible !important;
                    }
                    .svg-content {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        visibility: visible !important;
                    }
                    .highlighted-shape {
                        outline: 2px dashed #007bff;
                        outline-offset: 2px;
                    }
                    .react-flow__node {
                        visibility: visible !important;
                    }
                    .react-flow__handle {
                        visibility: visible !important;
                        pointer-events: ${data.isConnecting ? "auto" : "none"};
                    }
                    .react-flow__handle.invisible {
                        opacity: 0;
                    }
                    .react-flow__handle.visible {
                        opacity: 1;
                    }
                `}
            </style>
        </div>
    );
};

export default React.memo(SVGNode);
