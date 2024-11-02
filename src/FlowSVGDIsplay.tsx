import React, {
    useState,
    useCallback,
    useEffect,
    useMemo,
    MouseEvent as ReactMouseEvent
} from 'react';
import ReactFlow, {
    ReactFlowProvider,
    Node,
    Edge,
    Connection,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    NodeChange,
    EdgeChange,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';

import { DiagramComponent, CanvasSize, TransformationContext, GlobalAttachmentPoint } from '@/Types';
import SVGNode from '@/components/ui/SVGNode';
import LabelNode from '@/components/ui/LabelNode';
import CustomEdge from '@/components/ui/CustomEdge';
import {
    calculateSVGBoundingBox,
    calculateScale,
    calculateViewBox,
    DEFAULT_MARGIN
} from '@/lib/svgUtils';

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
    setSelectedAttachmentPoint: (point: string) => void
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
            setSelectedAttachmentPoint
        },
        draggable: false,
        selectable: false,
        deletable: false,
        style: { zIndex: 0 }
    };

    // Create label nodes for each shape if needed
    const labelNodes: Node[] = diagramComponents.map((component, index) => ({
        id: `label-${component.id}`,
        type: 'label',
        position: { x: 100 + (index * 50), y: 100 + (index * 30) },
        data: {
            label: component.shape,
            handleType: 'source'
        },
        draggable: true,
        style: { zIndex: 5 }
    }));

    return [mainNode, ...labelNodes];
};

const FlowSVGDisplay: React.FC<FlowSVGDisplayProps> = ({
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
    // State for React Flow nodes and edges
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

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
        selected3DShape,
        diagramComponents,
        canvasSize,
        isCopied,
        onSelect3DShape,
        setSelectedPosition,
        setSelectedAttachmentPoint
    ]);

    // Node change handler
    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes(prevNodes => applyNodeChanges(changes, prevNodes));
    }, []);

    // Edge change handler
    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        setEdges(prevEdges => applyEdgeChanges(changes, prevEdges));
    }, []);

    // Connection handler
    const onConnect = useCallback((connection: Connection) => {
        if (!connection.source || !connection.target) return;

        const newEdge: Edge = {
            id: `edge-${Date.now()}`,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            type: 'custom',
            animated: true,
            style: { stroke: '#555', zIndex: 10 }
        };

        setEdges(prevEdges => [...prevEdges, newEdge]);
    }, []);

    // Handle pane click for deselection
    // In FlowSVGDisplay.tsx, update the onPaneClick handler:
    const onPaneClick = useCallback((event: ReactMouseEvent<Element, MouseEvent>) => {
        // Check if we clicked on a node or its contents
        const target = event.target as HTMLElement;
        const isNodeClick = target.closest('.svg-wrapper');
        console.log('Flow click ', isNodeClick);

        // Only handle pane clicks (not node clicks)
        if (!isNodeClick) {
            onSelect3DShape(null);
            //setSelectedPosition('top');
            //setSelectedAttachmentPoint('none');
        }
    }, [onSelect3DShape, setSelectedPosition, setSelectedAttachmentPoint]);

    return (
        <div className="w-full h-full bg-white relative">
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onPaneClick={onPaneClick}
                    fitView
                    minZoom={0.5}
                    maxZoom={10}
                    snapToGrid
                    snapGrid={[10, 10]}
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </ReactFlowProvider>

            <style>
                {`
                    .react-flow__node {
                        max-width: none;
                        max-height: none;
                    }

                    /* Force edges container to be above nodes */
                    .react-flow__edges {
                        z-index: 10 !important;
                    }
                    
                    /* Ensure edge paths are visible */
                    .react-flow__edge-path {
                        z-index: 10 !important;;
                    }

                    /* Style edge interactions */
                    .react-flow__edge {
                        z-index: 10!important;;
                    }
                    .react-flow__edge:hover {
                        z-index: 11;
                    }
                    .react-flow__edge.selected {
                        z-index: 12;
                    }

                    /* Keep handles above edges */
                    .react-flow__handle {
                        z-index: 15!important;;
                    }

                    /* Keep edge labels above everything */
                    .react-flow__edgelabel-renderer {
                        z-index: 15;
                    }

                    /* Keep connection line above other elements */
                    .react-flow__connection {
                        z-index: 16!important;;
                    }

                    /* Controls should stay on top */
                    .react-flow__controls {
                        z-index: 20;
                    }
                `}
            </style>
        </div>
    );
};

export default FlowSVGDisplay;