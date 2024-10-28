import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    ReactFlowProvider,
    Position,
    Handle,
    NodeProps,
    EdgeTypes,
    EdgeProps,
    EdgeMouseHandler,
    Connection,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    NodeChange,
    EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
    getBezierPath,
} from 'reactflow';
import SVGNode from './components/ui/SVGNode';
import 'reactflow/dist/style.css';
import { DiagramComponent } from './Types';
import { getClosestAttachmentPoint } from './lib/diagramComponentsLib';


interface FlowSVGDisplayProps {
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

interface ConnectionPoint {
    id: string;
    position: Position;
    x: number;
    y: number;
}

interface SVGNodeData {
    svgContent: string;
    connectionPoints: ConnectionPoint[];
    attachmentPoints: Array<{
        id: string;
        x: number;
        y: number;
        side: 'left' | 'right';
    }>;
}

interface LabelNodeData {
    label: string;
}

// Custom Edge with Delete Button
const CustomEdge = ({
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
}: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <path
                id={id}
                style={{
                    ...style,
                    strokeWidth: 1.5,
                    stroke: '#555',
                }}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
            <g
                className="edge-controls"
                transform={`translate(${labelX - 12} ${labelY - 12})`}
                style={{ opacity: 0, transition: 'opacity 0.2s' }}
            >
                <circle r="12" fill="#ffffff" />
                <path
                    d="M -6 -6 L 6 6 M -6 6 L 6 -6"
                    stroke="#ff0000"
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                />
            </g>
        </>
    );
};

const edgeTypes: EdgeTypes = {
    custom: CustomEdge,
};

type CustomNode = Node<SVGNodeData | LabelNodeData>;

const MARGIN = 10;

// Modified Label Node with both left and right handles
const LabelNode = ({ data }: NodeProps<LabelNodeData>) => (
    <div className="px-4 py-2 rounded bg-gray-800 text-white text-sm border border-gray-600 shadow-lg">
        <Handle
            type="source"
            position={Position.Left}
            id="left"
            style={{ background: '#555', width: '8px', height: '8px' }}
        />
        {data.label}
        <Handle
            type="source"
            position={Position.Right}
            id="right"
            style={{ background: '#555', width: '8px', height: '8px' }}
        />
    </div>
);

const nodeTypes = {
    svgNode: SVGNode,
    label: LabelNode
};

const createInitialNodes = (
    svgContent: string,
    connectionPoints: ConnectionPoint[],
    canvasSize: { width: number; height: number },
    selected3DShape: string | null,
    diagramComponents: DiagramComponent[],
    isCopied: boolean,
    onSelect3DShape: (id: string | null) => void,
    setSelectedPosition: (position: string) => void,
    setSelectedAttachmentPoint: (point: string) => void
): CustomNode[] => [
        {
            id: 'svg-main',
            type: 'svgNode',
            position: { x: canvasSize.width / 2, y: canvasSize.height / 2 },
            data: {
                svgContent,
                connectionPoints,
                attachmentPoints: connectionPoints.map(point => ({
                    id: point.id,
                    x: point.x,
                    y: point.y,
                    side: point.position === Position.Left ? 'left' : 'right'
                })),
                selected3DShape,
                diagramComponents,
                isCopied,
                onSelect3DShape,
                setSelectedPosition,
                setSelectedAttachmentPoint
            },
            style: {
                width: canvasSize.width,
                height: canvasSize.height,
            },
            draggable: false,
            selectable: false,
        } as Node<SVGNodeData>,
        {
            id: 'label-1',
            type: 'label',
            position: {
                x: 0,
                y: (canvasSize.height / 2) - 20
            },
            data: { label: 'Microservice Component' },
            draggable: true
        } as Node<LabelNodeData>,
        {
            id: 'label-2',
            type: 'label',
            position: {
                x: 0,
                y: (canvasSize.height / 2) + 20
            },
            data: { label: 'Database Storage' },
            draggable: true
        } as Node<LabelNodeData>
    ];

const createInitialEdges = (): Edge[] => [];

const createConnectionPoints = (diagramComponents: DiagramComponent[], canvasSize: { width: number; height: number }): ConnectionPoint[] => {
    const points: ConnectionPoint[] = [];
    diagramComponents.forEach(component => {
        component.attachmentPoints.forEach((ap, index) => {
            // Determine side based on x coordinate relative to component center
            const side = ap.x < component.absolutePosition.x + canvasSize.width / 4 ? 'left' : 'right';
            points.push({
                id: `${component.id}-${ap.name}-${index}`, // Ensure unique ID
                position: side === 'left' ? Position.Left : Position.Right,
                x: ap.x,
                y: ap.y
            });
        });
    });
    return points;
};

// Flow component to use React Flow hooks
const Flow = ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
}: {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onNodeClick: (event: React.MouseEvent, node: Node) => void;
    onPaneClick: () => void;
}) => {
    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodesDraggable={false}
            nodesConnectable={true}
            snapToGrid={true}
            minZoom={0.5}
            maxZoom={2}
            fitView
            selectNodesOnDrag={false}
        >
            <Background />
            <Controls />
        </ReactFlow>
    );
};

const FlowSVGDisplay = ({
    svgContent,
    selected3DShape,
    diagramComponents,
    isCopied,
    onSelect3DShape,
    onGetBoundingBox,
    canvasSize,
    setSelectedPosition,
    setSelectedAttachmentPoint,
}: FlowSVGDisplayProps) => {
    const [highlightedShape, setHighlightedShape] = useState<string | null>(null);

    // Updated connectionPoints memo to use diagramComponents
    const connectionPoints = useMemo(() =>
        svgContent ? createConnectionPoints(diagramComponents, canvasSize) : [],
        [svgContent, diagramComponents, canvasSize]
    );

    const initialNodes = useMemo(() => {
        if (!svgContent) return [];
        return createInitialNodes(
            svgContent, 
            connectionPoints, 
            canvasSize,
            selected3DShape,
            diagramComponents,
            isCopied,
            onSelect3DShape,
            setSelectedPosition,
            setSelectedAttachmentPoint
        );
    }, [
        svgContent, 
        connectionPoints, 
        canvasSize,
        selected3DShape,
        diagramComponents,
        isCopied,
        onSelect3DShape,
        setSelectedPosition,
        setSelectedAttachmentPoint
    ]);

    const initialEdges = useMemo(() => {
        if (!svgContent) return [];
        return createInitialEdges();
    }, [svgContent]);

    const [nodes, setNodes] = useState<CustomNode[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    // Update highlighted shape when selected shape changes
    useEffect(() => {
        setHighlightedShape(selected3DShape);
    }, [selected3DShape]);

    const handlePaneClick = useCallback(() => {
        onSelect3DShape(null);
        setHighlightedShape(null);
    }, [onSelect3DShape]);

    // Update nodes when content changes
    useEffect(() => {
        if (!svgContent) {
            setNodes([]);
            setEdges([]);
            return;
        }
    
        setNodes(prevNodes => {
            const newNodes = createInitialNodes(
                svgContent,
                connectionPoints,
                canvasSize,
                selected3DShape,
                diagramComponents,
                isCopied,
                onSelect3DShape,
                setSelectedPosition,
                setSelectedAttachmentPoint
            );
            // Preserve positions of existing label nodes
            return newNodes.map(node => {
                const existingNode = prevNodes.find(n => n.id === node.id);
                if (existingNode && node.type === 'label') {
                    return {
                        ...node,
                        position: existingNode.position
                    };
                }
                return node;
            });
        });
    }, [
        svgContent, 
        connectionPoints, 
        canvasSize, 
        selected3DShape, 
        diagramComponents, 
        isCopied,
        onSelect3DShape,
        setSelectedPosition,
        setSelectedAttachmentPoint
    ]);
    
    useEffect(() => {
        setNodes(prevNodes => prevNodes.map(node => {
            if (node.type === 'svgNode') {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        isSelected: selected3DShape !== null
                    }
                };
            }
            return node;
        }));
    }, [selected3DShape]);

    // Enhanced node click handler
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (!svgContent) return; // Don't process clicks if no SVG content

        if (node.type !== 'svgNode') {
            // process any on click for label nodes
        }
    }, [svgContent, diagramComponents, onSelect3DShape, setSelectedPosition, setSelectedAttachmentPoint]);

    // Handle node changes (position updates, etc.)
    const onNodesChange: OnNodesChange = useCallback(
        (changes: NodeChange[]) => {
            setNodes((nds) => applyNodeChanges(changes, nds));
        },
        []
    );

    // Handle edge changes
    const onEdgesChange: OnEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            setEdges((eds) => applyEdgeChanges(changes, eds));
        },
        []
    );

    const createEdge = useCallback((connection: Connection): Edge => {
        if (!connection.source || !connection.target) {
            throw new Error('Invalid connection: missing source or target');
        }

        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);

        // Default to the provided handles or undefined
        let sourceHandle = connection.sourceHandle ?? undefined;
        let targetHandle = connection.targetHandle ?? undefined;

        // If connecting from a label node, determine the best handle to use
        if (sourceNode?.type === 'label' && targetNode) {
            // Get the x positions of the source and target nodes
            const sourceX = sourceNode.position.x;
            const targetX = targetNode.position.x;

            // Choose the appropriate handle based on relative positions
            sourceHandle = sourceX < targetX ? 'right' : 'left';
        }

        return {
            id: `edge-${edges.length + 1}`,
            source: connection.source,
            target: connection.target,
            sourceHandle,
            targetHandle,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#555' }
        } satisfies Edge;
    }, [nodes, edges.length]);

    // Enhanced connect handler with type safety
    const onConnect = useCallback(
        (connection: Connection) => {
            if (!svgContent || !connection.source || !connection.target) return;

            try {
                const newEdge = createEdge(connection);
                setEdges(eds => [...eds, newEdge]);
            } catch (error) {
                console.error('Failed to create edge:', error);
            }
        },
        [svgContent, createEdge]
    );

    // Handle edge click (for deletion)
    const onEdgeClick: EdgeMouseHandler = useCallback((event, edge) => {
        const confirmed = window.confirm('Do you want to remove this connection?');
        if (confirmed) {
            setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        }
    }, []);

    const onEdgeContextMenu = useCallback(
        (event: React.MouseEvent, edge: Edge) => {
            event.preventDefault();
            const confirmed = window.confirm('Do you want to remove this connection?');
            if (confirmed) {
                setEdges((eds) => eds.filter((e) => e.id !== edge.id));
            }
        },
        []
    );

    return (
        <div className="w-full h-full bg-white relative">
            <ReactFlowProvider>
                <div className="w-full h-full absolute" style={{ zIndex: 0 }}>
                    <Flow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={handlePaneClick}
                    />
                </div>
            </ReactFlowProvider>

            <style>
                {`
                    .react-flow {
                        z-index: auto !important;
                    }
                    .react-flow__edges {
                        z-index: 3 !important;
                    }
                    .react-flow__edge {
                        z-index: 3 !important;
                    }
                    .react-flow__edge-path {
                        z-index: 3 !important;
                    }
                    .react-flow__handle {
                        width: 8px;
                        height: 8px;
                        background: #4F46E5;
                        border: 2px solid white;
                        z-index: 4 !important;
                    }
                    .react-flow__handle-left {
                        left: -4px;
                    }
                    .react-flow__handle-right {
                        right: -4px;
                    }
                    .react-flow__node {
                        z-index: 1 !important;
                    }
                    .react-flow__node.selected {
                        z-index: 2 !important;
                    }
                    .react-flow__controls {
                        z-index: 5 !important;
                    }
                    .react-flow__edge-path {
                        stroke: #555;
                        stroke-width: 1.5;
                    }
                    .react-flow__edge.animated path {
                        stroke-dasharray: 5;
                        animation: dashedEdge 20s linear infinite;
                    }
                    .highlighted-shape {
                        outline: 2px dashed #007bff;
                        outline-offset: 2px;
                    }
                    @keyframes dashedEdge {
                        from { stroke-dashoffset: 100; }
                        to { stroke-dashoffset: 0; }
                    }
                    .edge-controls {
                        z-index: 4 !important;
                    }
                    .react-flow__edge-interaction {
                        z-index: 3 !important;
                    }
                `}
            </style>
        </div>
    );
};

export default FlowSVGDisplay;