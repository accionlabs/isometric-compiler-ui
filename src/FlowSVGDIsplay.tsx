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
    addEdge,
    useStoreApi,
    ReactFlowState,
    useStore,
    XYPosition
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';

import { DiagramComponent, CanvasSize } from "@/Types";
import SVGNode from "@/components/ui/SVGNode";
import LabelNode from "@/components/ui/LabelNode";
import CustomEdge from "@/components/ui/CustomEdge";
import MetadataNode from "@/components/ui/MetadataNode";

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

const nodeTypes = {
    svgNode: SVGNode,
    label: LabelNode,
    metadata: MetadataNode
};

const edgeTypes = {
    custom: CustomEdge
};

// Constants for metadata node positioning
const METADATA_NODE_SPACING = 250; // Space between nodes
const INITIAL_RADIUS = 200; // Initial distance from center
const ANGLE_INCREMENT = Math.PI / 6; // 30 degrees in radians

const calculateMetadataNodePosition = (
    index: number,
    totalNodes: number
): XYPosition => {
    // Calculate position in a spiral pattern
    const angle = ANGLE_INCREMENT * index;
    const radius =
        INITIAL_RADIUS + Math.floor(index / 12) * METADATA_NODE_SPACING;

    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
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
): Node[] => {
    // Create main SVG node at the center
    const mainNode: Node = {
        id: "svg-main",
        type: "svgNode",
        position: { x: 0, y: 0 },
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
            isInteractive
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

    // Create metadata nodes positioned around the main SVG
    const metadataNodes: Node[] = componentsWithMetadata.map(
        (component, index) => {
            const position = calculateMetadataNodePosition(
                index,
                componentsWithMetadata.length
            );

            return {
                id: `metadata-${component.id}`,
                type: "metadata",
                position: position,
                data: {
                    componentId: component.id,
                    type: component.type,
                    metadata: component.metadata,
                    isInteractive,
                    isConnecting
                },
                draggable: isInteractive,
                style: { zIndex: 4 }
            };
        }
    );

    return [mainNode, ...metadataNodes];
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
            const newNodes = createInitialNodes(
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

            // Preserve positions of existing nodes when possible
            return newNodes.map((node) => {
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
        isInteractive
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
        <div className="w-full h-full relative">
            <ReactFlowProvider>
                <FlowContent {...props} />
            </ReactFlowProvider>
            <style>
                {`
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
