import React, {
    useState,
    useCallback,
    useEffect,
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

import { Point, DiagramComponent, CanvasSize } from "@/Types";
import SVGNode, {
    ComponentBounds,
    ComponentBoundsMap,
    HandlePosition
} from "@/components/flow/SVGNode";
import LabelNode from "@/components/flow/LabelNode";
import CustomEdge, { CustomEdgeProps } from "@/components/flow/CustomEdge";
import MetadataNode, { MetadataNodeData } from "@/components/flow/MetadataNode";
import {
    BaseLayoutManager,
    LayoutManagerFactory,
    RectangularLayoutConfig,
    HullBasedLayoutConfig
} from "@/lib/layoutUtils";

interface FlowSVGDisplayProps {
    svgContent: string;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
    isCopied: boolean;
    onSelect3DShape: (id: string | null) => void;
    canvasSize: { width: number; height: number };
    setSelectedPosition: (position: string) => void;
    setSelectedAttachmentPoint: (point: string) => void;
}

type FlowEdge = Edge<CustomEdgeProps["data"]>;

interface MarkerNodeData extends Record<string, unknown> {
    componentId: string;
    id: string;
    position: XYPosition;
}
type MarkerNodeType = Node<MarkerNodeData>;

const MarkerNode: React.FC<NodeProps<MarkerNodeType>> = ({data}) => {
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
)};

const nodeTypes = {
    svgNode: SVGNode,
    label: LabelNode,
    metadata: MetadataNode,
    marker: MarkerNode
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
        padding: 150,
        minSpacing: 150,
        minYSpacing: 50,
        smoothingAngle: Math.PI / 4, // 45 degrees
        placementDistance: 100,
        stepSize: 20
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
    setSelectedPosition,
    setSelectedAttachmentPoint
}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const store = useStoreApi();
    const { fitView } = useReactFlow();
    const [componentBounds, setComponentBounds] = useState<ComponentBoundsMap>(
        {}
    );
    const [layoutManager, setLayoutManager] =
        useState<BaseLayoutManager | null>(null);

    // Handler for component bounds updates
    const handleComponentBoundsUpdate = useCallback(
        (bounds: ComponentBoundsMap) => {
            console.log("Component bounds updated:", bounds);
            setComponentBounds(bounds);
        },
        [setComponentBounds]
    );

    // Update layout manager when component bounds change
    useEffect(() => {
        const rootBounds = componentBounds["root"];
        if (!rootBounds) return;

        const svgCenter = {
            x: rootBounds.center.x,
            y: rootBounds.center.y
        };

        const layoutType = "hull-based";
        const config = LAYOUT_CONFIG[layoutType];

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

    const getHandlesForConnection = (
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
                        (isBelow ? "attach-front-right" : "attach-back-right")
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
        const widthAdjustment = 75; // configured to approximate the width of the metadata node
        const isVerticallyAligned = Math.abs(dy) > Math.abs(dx - widthAdjustment) ;
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
    };

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
        isConnecting: boolean,
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
                isConnecting,
                isInteractive,
                onComponentBoundsUpdate: handleComponentBoundsUpdate
            },
            draggable: false,
            selectable: false,
            deletable: false,
            style: { zIndex: 0 }
        };

        // Filter components with metadata
        const componentsWithMetadata = diagramComponents.filter(
            (component) => component.type && component.metadata
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
                            isInteractive,
                            isConnecting
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
                        isConnecting
                    } as MetadataNodeData,
                    draggable: isInteractive,
                    style: { zIndex: 4 }
                };
            }
        );

        const placementPoints = layoutManager?.getPoints();
        const markerNodes = placementPoints ? placementPoints.map((point,index) => {
            return {
                id:`p-${index}`,
                type:'marker',
                position: {
                    x: point.x,
                    y: point.y
                },
                data: {
                    componentId:'root'
                } as MarkerNodeData
            }
        }) : [];

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
                    type: "custom",
                    deletable: false,
                    data: { permanent: true }
                } as FlowEdge;
            })
            .filter((edge): edge is FlowEdge => edge !== null);

        return { nodes: [ mainNode, ...metadataNodes], edges };
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
                isConnecting,
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
            console.log("edges:", result.edges);
            setEdges(result.edges);
            return result.nodes; // Return the nodes!
        });
    }, [
        svgContent,
        selected3DShape,
        diagramComponents,
        canvasSize,
        isCopied,
        onSelect3DShape,
        setSelectedPosition,
        setSelectedAttachmentPoint,
        isConnecting,
        isInteractive,
        componentBounds
    ]);

    // Track connection state
    useEffect(() => {
        const subscription = store.subscribe((state: ReactFlowState) => {
            setIsConnecting(state.connectionClickStartHandle !== null);
        });
        return () => subscription();
    }, [store]);

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
