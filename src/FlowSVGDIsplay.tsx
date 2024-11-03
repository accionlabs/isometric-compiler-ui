import React, {
    useState,
    useCallback,
    useEffect,
    MouseEvent as ReactMouseEvent
} from 'react';
import ReactFlow, {
    ReactFlowProvider,
    Node,
    Edge,
    Connection,
    Controls,
    Background,
    ConnectionMode,
    useNodesState,
    useEdgesState,
    addEdge,
    useStoreApi,
    ReactFlowState,
    useStore
} from 'reactflow';
import 'reactflow/dist/style.css';

import { DiagramComponent, CanvasSize } from '@/Types';
import SVGNode from '@/components/ui/SVGNode';
import LabelNode from '@/components/ui/LabelNode';
import CustomEdge from '@/components/ui/CustomEdge';

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

const nodeTypes = {
    svgNode: SVGNode,
    label: LabelNode
};

const edgeTypes = {
    custom: CustomEdge
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
    isInteractive: boolean,
    addTestLabels: boolean
): Node[] => {
    // Create main SVG node
    const mainNode: Node = {
        id: 'svg-main',
        type: 'svgNode',
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

    // Create label nodes for each shape if needed
    const labelNodes: Node[] = addTestLabels ? diagramComponents.map((component, index) => ({
        id: `label-${component.id}`,
        type: 'label',
        position: { x: 100 + (index * 50), y: 100 + (index * 30) },
        data: {
            label: component.shape,
            handleType: 'source',
            isInteractive
        },
        draggable: isInteractive,
        style: { zIndex: 5 }
    })) : [];

    return [mainNode, ...labelNodes];
};

// Separate internal component that uses React Flow hooks
const FlowContent: React.FC<FlowSVGDisplayProps> = ({
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
    const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const store = useStoreApi();

    const addTestLabels:boolean = false;

    const isInteractive = useStore((state) => state.nodesDraggable && state.nodesConnectable && state.elementsSelectable);

    // Update nodes when content or components change
    useEffect(() => {
        if (!svgContent) {
            setNodes([]);
            setEdges([]);
            return;
        }

        setNodes(prevNodes => {
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
                isInteractive,
                addTestLabels
            );

            // Preserve positions of existing label nodes
            return newNodes.map(node => {
                const existingNode = prevNodes.find(n => n.id === node.id);
                if (existingNode && node.type === 'label') {
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
            setIsConnecting(state.connectionStartHandle !== null);
        });
        return () => subscription();
    }, [store]);

    // Connection handler
    const onConnect = useCallback((connection: Connection) => {
        if (!isInteractive) return; // Prevent edge creation when not interactive
        if (!connection.source || !connection.target) return;
        setEdges((eds) => addEdge(connection, eds));
    }, [setEdges, isInteractive]);

    // Handle pane click for deselection
    const onPaneClick = useCallback((event: ReactMouseEvent<Element, MouseEvent>) => {
        if (!isInteractive) return; // Prevent interaction when not interactive
        
        const target = event.target as HTMLElement;
        const isNodeClick = target.closest('.svg-wrapper');

        if (!isNodeClick) {
            onSelect3DShape(null);
            setSelectedPosition('top');
            setSelectedAttachmentPoint('none');
            
            setNodes(prevNodes => 
                prevNodes.map(node => {
                    if (node.type === 'svgNode') {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                selected3DShape: null
                            }
                        };
                    }
                    return node;
                })
            );
        }
    }, [isInteractive, onSelect3DShape, setSelectedPosition, setSelectedAttachmentPoint, setNodes]);

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
            elementsSelectable={isInteractive}
        >
            <Background />
            <Controls />
        </ReactFlow>
    );
};

// Main component that provides the ReactFlow context
const FlowSVGDisplay: React.FC<FlowSVGDisplayProps> = (props) => {
    return (
        <div className="w-full h-full bg-white relative">
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