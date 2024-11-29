import React from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import type { HandleType } from '@xyflow/react';

export type LabelNodeData = Node< {
    label: string;
    handleType?: HandleType;
    isInteractive: boolean;  // Add isInteractive flag
}>;

const LabelNode = ({ data }: NodeProps<LabelNodeData>) => {
    const handleType = data.handleType ?? 'source';

    const handleStyle = {
        opacity: data.isInteractive ? 1 : 0.5,  // Dim handles when not interactive
        pointerEvents: data.isInteractive ? 'auto' : 'none'  // Disable handle interactions
    };

    return (
        <div className={`relative px-4 py-2 rounded bg-white text-black text-sm border border-gray-600 shadow-lg ${!data.isInteractive ? 'opacity-75' : ''}`}>
            <Handle
                type={handleType}
                position={Position.Left}
                id="left"
                isConnectable={data.isInteractive}
            />
            <span className="whitespace-nowrap">{data.label}</span>
            <Handle
                type={handleType}
                position={Position.Right}
                id="right"
                isConnectable={data.isInteractive}
            />
        </div>
    );
};

export default React.memo(LabelNode);