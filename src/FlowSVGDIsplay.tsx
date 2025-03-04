// @/FlowSVGDisplay.tsx

import React, {
    useState,
    useCallback,
    useEffect,
    useRef,
    MouseEvent as ReactMouseEvent,
    useMemo
} from "react";
import {
    ReactFlow,
    ReactFlowProvider,
    Node,
    Edge,
    Connection,
    Controls,
    Background,
    ConnectionMode,
    useReactFlow,
    useNodesState,
    useEdgesState,
    NodeProps,
    addEdge,
    useStoreApi,
    ReactFlowState,
    useStore,
    XYPosition,
    Position
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Point, DiagramComponent, CanvasSize, CanvasSettings } from "@/Types";
import SVGNode, {
    ComponentBounds,
    ComponentBoundsMap,
    HandlePosition,
    SVGLayout,
    convertSVGToContainerCoords
} from "@/components/flow/SVGNode";
import CustomEdge, { CustomEdgeProps } from "@/components/flow/CustomEdge";
import MetadataNode, { MetadataNodeData } from "@/components/flow/MetadataNode";
import IsometricTextNode, {
    IsometricTextNodeData
} from "./components/flow/IsometricTextNode";
import {
    BaseLayoutManager,
    LayoutManagerFactory,
    RectangularLayoutConfig,
    HullBasedLayoutConfig
} from "@/lib/layoutUtils";
import { getGlobalAttachmentPoints } from "./lib/diagramComponentsLib";

interface FlowSVGDisplayProps {
    svgContent: string;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
    isCopied: boolean;
    onSelect3DShape: (id: string | null) => void;
    canvasSize: { width: number; height: number };
    settings: CanvasSettings | null;
    setSelectedPosition: (position: string) => void;
    setSelectedAttachmentPoint: (point: string) => void;
    handleComponentMetadata: (metadata: Record<string, any>) => void;
}

type FlowEdge = Edge<CustomEdgeProps["data"]>;

interface MarkerNodeData extends Record<string, unknown> {
    componentId: string;
    id: string;
    position: XYPosition;
}
type MarkerNodeType = Node<MarkerNodeData>;

const MarkerNode: React.FC<NodeProps<MarkerNodeType>> = ({ data }) => {
    return (
        <div
            className="absolute rounded-full"
            style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                backgroundColor: "red",
                border: "2px solid white",
                transform: "translate(-50%,-50%)"
            }}
        />
    );
};
interface MetadataNodeProps extends NodeProps<Node<MetadataNodeData>> {
    // No need to add onProcess here since it will go into the data prop
}

// Define your custom function
const nodeTypes = {
    svgNode: SVGNode,
    metadata: (props: MetadataNodeProps) => {
        const { handleComponentMetadata } = props.data; // Extract the function from props

        const enhancedData = {
            ...props.data,
            onProcess: handleComponentMetadata as (
                metadata: Record<string, any>
            ) => void
        };

        return <MetadataNode {...props} data={enhancedData} />;
    },
    marker: MarkerNode,
    isometricText: IsometricTextNode
};

const edgeTypes = {
    custom: CustomEdge
};

// Layout configuration constants
// In FlowSVGDisplay.tsx
const LAYOUT_CONFIG = {
    rectangular: {
        padding: 150,
        minSpacing: 80,
        spacingAdjustFactor: 1.2
    } as RectangularLayoutConfig,

    "hull-based": {
        padding: 100, // padding to expand hull
        minSpacing: 200, // minimum X spacing between metadata labels
        minYSpacing: 17, // minimum Y spacing between metadata labels
        smoothingAngle: (Math.PI * 2) / 3, // hull smoothing angle 120 degrees
        stepSize: 20 // distance between metadata label positions
    } as HullBasedLayoutConfig
};

// FlowContent Component
const FlowContent: React.FC<FlowSVGDisplayProps> = ({
    svgContent,
    selected3DShape,
    diagramComponents,
    isCopied,
    onSelect3DShape,
    canvasSize,
    settings,
    setSelectedPosition,
    setSelectedAttachmentPoint,
    handleComponentMetadata
}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const store = useStoreApi();
    const { fitView } = useReactFlow();
    const [pendingEdgeUpdates, setPendingEdgeUpdates] = useState<FlowEdge[]>(
        []
    );
    const edgeUpdateTimeoutRef = useRef<NodeJS.Timeout>();
    const [areComponentBoundsReady, setAreComponentBoundsReady] =
        useState(false);
    const [componentBounds, setComponentBounds] = useState<ComponentBoundsMap>(
        {}
    );
    const [svgLayout, setSVGLayout] = useState<SVGLayout>();
    const [layoutManager, setLayoutManager] =
        useState<BaseLayoutManager | null>(null);
    const [initialLayoutComplete, setInitialLayoutComplete] = useState(false);
    const prevDiagramComponentsRef = useRef<DiagramComponent[]>([]);

    // Debug: Log state changes
    useEffect(() => {
        console.log("State Change Debug:", {
            nodesCount: nodes.length,
            edgesCount: edges.length,
            diagramComponentsCount: diagramComponents.length,
            areComponentBoundsReady,
            hasLayoutManager: !!layoutManager,
            componentBoundsCount: Object.keys(componentBounds).length
        });
    }, [
        nodes.length,
        edges.length,
        diagramComponents.length,
        areComponentBoundsReady,
        layoutManager,
        componentBounds
    ]);

    // Debug: Track diagram component changes
    useEffect(() => {
        const prevComponents = prevDiagramComponentsRef.current;
        const changedComponents = diagramComponents.filter(
            (comp) =>
                !prevComponents.find(
                    (prev) => prev.id === comp.id && prev.type === comp.type
                )
        );

        if (changedComponents.length > 0) {
            console.log("Diagram Components Changed:", {
                changed: changedComponents,
                total: diagramComponents.length,
                hasMetadata: diagramComponents.filter(
                    (c) => c.type && c.metadata
                ).length
            });
        }

        prevDiagramComponentsRef.current = diagramComponents;
    }, [diagramComponents]);

    // Handler for component bounds updates
    const handleComponentBoundsUpdate = useCallback(
        (bounds: ComponentBoundsMap) => {
            //console.log("Component bounds updated:", bounds);
            setComponentBounds(bounds);
            setAreComponentBoundsReady(true);
        },
        [setComponentBounds]
    );

    const handleSVGLayoutUpdate = useCallback(
        (layout: SVGLayout) => {
            setSVGLayout(layout);
            //console.log("Svg Layout:", layout);
        },
        [setSVGLayout]
    );

    // Update layout manager when component bounds change
    useEffect(() => {
        const rootBounds = componentBounds["root"];
        if (!rootBounds || !areComponentBoundsReady) return;

        const svgCenter = {
            x: rootBounds.center.x,
            y: rootBounds.center.y
        };

        const layoutType = "hull-based";
        let config = LAYOUT_CONFIG[layoutType];
        if (settings && settings.metadataLabel) {
            config = { ...config, ...settings.metadataLabel };
        }

        // Need to update LayoutManagerFactory to support smart layouts
        setLayoutManager(
            LayoutManagerFactory.createLayoutManager(
                layoutType,
                rootBounds.bounds,
                svgCenter,
                componentBounds,
                config
            )
        );
    }, [componentBounds]);

    const calculateMetadataNodePositions = useCallback(
        (componentsWithMetadata: DiagramComponent[]) => {
            if (!layoutManager || !componentBounds["root"]) return new Map();

            // Prepare component positions with angles
            const componentPositions = componentsWithMetadata
                .map((component) => {
                    const bounds = componentBounds[component.id];
                    if (!bounds) return null;

                    const angle = Math.atan2(
                        bounds.center.y - componentBounds["root"].center.y,
                        bounds.center.x - componentBounds["root"].center.x
                    );

                    return {
                        componentId: component.id,
                        angle,
                        center: bounds.center
                    };
                })
                .filter((pos): pos is NonNullable<typeof pos> => pos !== null);

            return layoutManager.calculateLayout(componentPositions);
        },
        [layoutManager, componentBounds]
    );

    const getHandlesForConnection = useCallback(
        (
            metadataNode: Node,
            componentBounds: ComponentBounds,
            handles: HandlePosition[]
        ): {
            sourceHandle: string;
            targetHandle: string;
            sourcePosition: Position;
        } => {
            const metadataCenter = {
                x: metadataNode.position.x,
                y: metadataNode.position.y
            };

            // Calculate relative position to component
            const dx = metadataCenter.x - componentBounds.center.x;
            const dy = metadataCenter.y - componentBounds.center.y;

            // Find available handles for this component
            const validHandles = handles.filter(
                (h) => h.componentId === componentBounds.id
            );

            // Choose appropriate target handle based on metadata node position
            const isRight = dx > 0;
            const isBelow = dy > 0;

            // Select target handle - prefer front handles over back handles
            const targetHandle =
                validHandles.find((h) => {
                    if (isRight) {
                        return (
                            h.pointName ===
                            (isBelow
                                ? "attach-front-right"
                                : "attach-back-right")
                        );
                    } else {
                        return (
                            h.pointName ===
                            (isBelow ? "attach-front-left" : "attach-back-left")
                        );
                    }
                })?.id ||
                validHandles[0]?.id ||
                "";

            // For metadata node, determine which handle to use
            const metaData = metadataNode.data as MetadataNodeData;
            const widthAdjustment = 200; // configured to approximate the width of the metadata node
            const isVerticallyAligned =
                Math.abs(dy) > Math.abs(dx - widthAdjustment);
            let sourcePosition: Position;
            let sourceHandle: string;

            if (isVerticallyAligned) {
                if (dy > 0) {
                    sourcePosition = Position.Top;
                    sourceHandle = `metadata-${metaData.componentId}-top`;
                } else {
                    sourcePosition = Position.Bottom;
                    sourceHandle = `metadata-${metaData.componentId}-bottom`;
                }
            } else {
                if (dx > 0) {
                    sourcePosition = Position.Left;
                    sourceHandle = `metadata-${metaData.componentId}-left`;
                } else {
                    sourcePosition = Position.Right;
                    sourceHandle = `metadata-${metaData.componentId}-right`;
                }
            }

            return {
                sourceHandle,
                targetHandle,
                sourcePosition
            };
        },
        []
    ); // Empty dependencies as this function doesn't depend on any external values

    // Update node positions when layout manager or components change
    useEffect(() => {
        if (!layoutManager || !areComponentBoundsReady) {
            console.log("Layout Update Skipped:", {
                hasLayoutManager: !!layoutManager,
                areComponentBoundsReady,
                componentBoundsCount: Object.keys(componentBounds).length
            });
            return;
        }

        const componentsWithMetadata = diagramComponents.filter(
            (component) => component.type && component.metadata
        );

        console.log("Processing Components:", {
            total: diagramComponents.length,
            withMetadata: componentsWithMetadata.length,
            componentBounds: Object.keys(componentBounds)
        });

        const nodePositions = calculateMetadataNodePositions(
            componentsWithMetadata
        );

        if (nodePositions.size === 0) {
            console.log("No node positions calculated");
            return;
        }

        console.log("Node Positions Calculated:", {
            positionsCount: nodePositions.size,
            positions: Array.from(nodePositions.entries()).map(([id, pos]) => ({
                id,
                position: pos.position
            }))
        });

        // Update both nodes and edges together to maintain synchronization
        setNodes((prevNodes) => {
            const updatedNodes = prevNodes.map((node) => {
                if (node.type === "metadata") {
                    const metaData = node.data as MetadataNodeData;
                    const position = nodePositions.get(metaData.componentId);

                    if (position) {
                        return {
                            ...node,
                            position: position.position,
                            data: {
                                ...node.data,
                                alignment: position.alignment
                            }
                        };
                    }
                }
                return node;
            });

            // Debug node updates
            console.log("Nodes Updated:", {
                prevCount: prevNodes.length,
                newCount: updatedNodes.length,
                metadataNodes: updatedNodes.filter((n) => n.type === "metadata")
                    .length
            });
            // Create new edges for the updated node positions
            const newEdges: FlowEdge[] = updatedNodes
                .filter(
                    (node): node is Node<MetadataNodeData> =>
                        node.type === "metadata"
                )
                .map((metadataNode) => {
                    const metaData = metadataNode.data;
                    const componentId = metaData.componentId;
                    const componentBound = componentBounds[componentId];

                    if (!componentBound) {
                        console.log(`No component bounds for: ${componentId}`);
                        return null;
                    }

                    // Extract global attachment points from diagram components
                    const globalAttachmentPoints = diagramComponents.flatMap(
                        (component) => {
                            const points = (
                                component.attachmentPoints || []
                            ).map((point) => ({
                                id: `${component.id}-${point.name}`,
                                position: point.name.includes("left")
                                    ? Position.Left
                                    : Position.Right,
                                type: "target" as const,
                                x: point.x,
                                y: point.y,
                                componentId: component.id,
                                pointName: point.name
                            }));
                            console.log(
                                `Attachment points for ${component.id}:`,
                                points
                            );
                            return points;
                        }
                    );

                    const { sourceHandle, targetHandle, sourcePosition } =
                        getHandlesForConnection(
                            metadataNode,
                            componentBound,
                            globalAttachmentPoints
                        );

                    console.log("Edge Connection Details:", {
                        nodeId: metadataNode.id,
                        sourceHandle,
                        targetHandle,
                        sourcePosition
                    });

                    if (!sourceHandle || !targetHandle) {
                        console.log(
                            `Missing handles for node: ${metadataNode.id}`
                        );
                        return null;
                    }

                    return {
                        id: `metadata-edge-${metadataNode.id}`,
                        source: metadataNode.id,
                        target: "svg-main",
                        sourceHandle,
                        targetHandle,
                        type: "simplebezier",
                        deletable: false,
                        selectable: false,
                        data: { permanent: true }
                    } as FlowEdge;
                })
                .filter((edge): edge is FlowEdge => edge !== null);

            // Queue edge updates
            setPendingEdgeUpdates(newEdges);

            if (!initialLayoutComplete) {
                setInitialLayoutComplete(true);
                setTimeout(() => fitView({ padding: 0.2 }), 100);
            }

            return updatedNodes;
        });
    }, [
        layoutManager,
        diagramComponents,
        areComponentBoundsReady,
        initialLayoutComplete,
        componentBounds,
        settings,
        calculateMetadataNodePositions,
        getHandlesForConnection
    ]);

    // Handle edge updates in a separate effect with a slight delay
    useEffect(() => {
        if (pendingEdgeUpdates.length > 0) {
            if (edgeUpdateTimeoutRef.current) {
                clearTimeout(edgeUpdateTimeoutRef.current);
            }

            edgeUpdateTimeoutRef.current = setTimeout(() => {
                setEdges(pendingEdgeUpdates);
                setPendingEdgeUpdates([]);
            }, 50); // Small delay to ensure node updates are processed
        }

        return () => {
            if (edgeUpdateTimeoutRef.current) {
                clearTimeout(edgeUpdateTimeoutRef.current);
            }
        };
    }, [pendingEdgeUpdates]);

    // Helper function to create initial nodes
    const createInitialNodes = (
        canvasSize: CanvasSize,
        svgContent: string,
        selected3DShape: string | null,
        diagramComponents: DiagramComponent[],
        isCopied: boolean,
        onSelect3DShape: (id: string | null) => void,
        setSelectedPosition: (position: string) => void,
        setSelectedAttachmentPoint: (point: string) => void,
        isInteractive: boolean
    ): { nodes: Node[]; edges: Edge[] } => {
        // Create main SVG node at the center
        const mainNode: Node = {
            id: "svg-main",
            type: "svgNode",
            position: { x: 0, y: 0 },
            width: canvasSize.width,
            height: canvasSize.height,
            data: {
                canvasSize,
                svgContent,
                diagramComponents,
                selected3DShape,
                isCopied,
                onSelect3DShape,
                setSelectedPosition,
                setSelectedAttachmentPoint,
                isInteractive,
                onComponentBoundsUpdate: handleComponentBoundsUpdate,
                onSVGLayoutUpdate: handleSVGLayoutUpdate
            },
            draggable: false,
            selectable: false,
            deletable: false,
            style: { zIndex: 0 }
        };

        // Filter components with metadata
        const componentsWithMetadata = diagramComponents.filter(
            (component) =>
                component.type &&
                component.type !== "layer" &&
                component.metadata
        );
        // Calculate all metadata node positions
        const nodePositions = calculateMetadataNodePositions(
            componentsWithMetadata
        );

        // Create metadata nodes with calculated positions
        const metadataNodes: Node[] = componentsWithMetadata.map(
            (component) => {
                const nodePosition = nodePositions.get(component.id);

                if (!nodePosition) {
                    // Fallback to center if position not calculated
                    return {
                        id: `metadata-${component.id}`,
                        type: "metadata",
                        position: { x: 0, y: 0 },
                        width: canvasSize.width,
                        height: canvasSize.height,
                        data: {
                            componentId: component.id,
                            type: component.type,
                            metadata: component.metadata,
                            alignment: "right",
                            isInteractive
                        },
                        draggable: isInteractive,
                        style: { zIndex: 4 }
                    };
                }

                return {
                    id: `metadata-${component.id}`,
                    type: "metadata",
                    position: nodePosition.position,
                    data: {
                        componentId: component.id,
                        type: component.type,
                        metadata: component.metadata,
                        alignment: nodePosition.alignment,
                        isInteractive,
                        handleComponentMetadata
                    } as MetadataNodeData,
                    draggable: false,
                    style: { zIndex: 4 }
                };
            }
        );

        const placementPoints = layoutManager?.getPoints();
        const markerNodes = placementPoints
            ? placementPoints.map((point, index) => {
                  return {
                      id: `p-${index}`,
                      type: "marker",
                      position: {
                          x: point.x,
                          y: point.y
                      },
                      data: {
                          componentId: "root"
                      } as MarkerNodeData
                  };
              })
            : [];

        const layerComponents = diagramComponents.filter(
            (component) =>
                component.type &&
                component.type === "layer" &&
                component.metadata &&
                component.metadata.name &&
                component.metadata.labelPosition
        );
        const isoTextNodes: Node[] = layerComponents.map((layer) => {
            const metadata = layer.metadata;
            let position = { x: 100, y: 100 };
            let textString = metadata?.name;
            let attachment = metadata?.labelPosition;
            const attachmentPoints = getGlobalAttachmentPoints(layer);
            if (svgLayout && attachmentPoints[`attach-${attachment}`]) {
                position = convertSVGToContainerCoords(
                    svgLayout,
                    attachmentPoints[`attach-${attachment}`]
                );
            }
            const isoNodeData = {
                ...{
                    text: textString,
                    attachment: attachment,
                    width: 200,
                    scale: svgLayout?.scale,
                    isInteractive: true
                },
                ...settings?.layerLabel
            } as IsometricTextNodeData;
            return {
                id: `label-${layer.id}`,
                type: "isometricText",
                position: position as Point,
                data: isoNodeData
            } as Node;
        });
        //("Layer Nodes:", isoTextNodes);

        const edges: FlowEdge[] = metadataNodes
            .map((metadataNode) => {
                const metaData = metadataNode.data as MetadataNodeData;
                const componentId = metaData.componentId;
                const componentBound = componentBounds[componentId];

                if (!componentBound) return null;

                // Extract global attachment points from diagram components
                const globalAttachmentPoints = diagramComponents.flatMap(
                    (component) =>
                        (component.attachmentPoints || []).map((point) => ({
                            id: `${component.id}-${point.name}`,
                            position: point.name.includes("left")
                                ? Position.Left
                                : Position.Right,
                            type: "target" as const,
                            x: point.x,
                            y: point.y,
                            componentId: component.id,
                            pointName: point.name
                        }))
                );

                const { sourceHandle, targetHandle, sourcePosition } =
                    getHandlesForConnection(
                        metadataNode,
                        componentBound,
                        globalAttachmentPoints
                    );

                if (!sourceHandle || !targetHandle) return null;

                return {
                    id: `metadata-edge-${metadataNode.id}`,
                    source: metadataNode.id,
                    target: "svg-main",
                    sourceHandle,
                    targetHandle,
                    type: "simplebezier",
                    deletable: false,
                    selectable: false,
                    animated: false,
                    data: { permanent: true }
                } as FlowEdge;
            })
            .filter((edge): edge is FlowEdge => edge !== null);

        return {
            nodes: [...isoTextNodes, mainNode, ...metadataNodes], //, ...markerNodes],
            edges
        };
    };

    const isInteractive = useStore(
        (state) =>
            state.nodesDraggable &&
            state.nodesConnectable &&
            state.elementsSelectable
    );

    // Update nodes when content or components change
    useEffect(() => {
        if (!svgContent) {
            setNodes([]);
            setEdges([]);
            return;
        }

        setNodes((prevNodes) => {
            const result = createInitialNodes(
                canvasSize,
                svgContent,
                selected3DShape,
                diagramComponents,
                isCopied,
                onSelect3DShape,
                setSelectedPosition,
                setSelectedAttachmentPoint,
                isInteractive
            );

            // Preserve positions of existing nodes
            const nodesWithPosition = result.nodes.map((node) => {
                const existingNode = prevNodes.find((n) => n.id === node.id);
                if (existingNode && node.type === "metadata") {
                    return {
                        ...node,
                        position: existingNode.position,
                        draggable: isInteractive
                    };
                }
                return node;
            });
            setEdges(result.edges);
            return result.nodes; // Return the nodes!
        });
    }, [
        svgContent,
        selected3DShape,
        diagramComponents,
        canvasSize,
        settings,
        isCopied,
        onSelect3DShape,
        setSelectedPosition,
        setSelectedAttachmentPoint,
        isInteractive,
        componentBounds,
        svgLayout
    ]);

    // Fit view after nodes are updated
    useEffect(() => {
        if (nodes.length > 0) {
            fitView({ padding: 0.2 });
        }
    }, [nodes.length, fitView]);

    // Connection handler
    const onConnect = useCallback(
        (connection: Connection) => {
            if (!isInteractive) return;
            if (!connection.source || !connection.target) return;
            setEdges((eds) => addEdge(connection, eds));
        },
        [setEdges, isInteractive]
    );

    // Handle pane click for deselection
    const onPaneClick = useCallback(
        (event: ReactMouseEvent<Element, MouseEvent>) => {
            if (!isInteractive) return;

            const target = event.target as HTMLElement;
            const isNodeClick = target.closest(".svg-wrapper");

            if (!isNodeClick) {
                onSelect3DShape(null);
                setSelectedPosition("top");
                setSelectedAttachmentPoint("none");
            }
        },
        [
            isInteractive,
            onSelect3DShape,
            setSelectedPosition,
            setSelectedAttachmentPoint
        ]
    );

    return (
        <ReactFlow
            colorMode="light"
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            connectionMode={ConnectionMode.Loose}
            fitView
            minZoom={0.5}
            maxZoom={10}
            snapToGrid
            snapGrid={[10, 10]}
            nodesConnectable={isInteractive}
            nodesDraggable={isInteractive}
            nodesFocusable={false}
            elementsSelectable={isInteractive}
        >
            <Background />
            <Controls />
        </ReactFlow>
    );
};

// Main component wrapper with ReactFlow provider
const FlowSVGDisplay: React.FC<FlowSVGDisplayProps> = (props) => {
    return (
        <div className="w-full h-full bg-white relative">
            <ReactFlowProvider>
                <FlowContent {...props} />
            </ReactFlowProvider>
            <style>
                {`
                    .react-flow__controls-button {
                        background-color:#555;
                    }
                    .react-flow__controls-button:hover {
                        background-color:#777;
                    }
                    .react-flow__node {
                        max-width: none;
                        max-height: none;
                    }
                    .react-flow__edges {
                        z-index: 10 !important;
                    }
                    .react-flow__edge-path {
                        z-index: 10 !important;
                    }
                    .react-flow__edge {
                        z-index: 10!important;
                    }
                    .react-flow__edge:hover {
                        z-index: 11;
                    }
                    .react-flow__edge.selected {
                        z-index: 12;
                    }
                    .react-flow__handle {
                        z-index: 15!important;
                    }
                    .react-flow__edgelabel-renderer {
                        z-index: 15;
                    }
                    .react-flow__connection {
                        z-index: 16!important;
                    }
                    .react-flow__controls {
                        z-index: 20;
                    }
                `}
            </style>
        </div>
    );
};

export default FlowSVGDisplay;
