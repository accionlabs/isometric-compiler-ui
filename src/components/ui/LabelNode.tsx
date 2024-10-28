import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { HandleType } from '@reactflow/core';

export interface LabelNodeData {
    label: string;
    handleType?: HandleType;
}

const LabelNode = ({ data }: NodeProps<LabelNodeData>) => {
    const handleType = data.handleType ?? 'source';

    const handleStyle = {
        background: '#555',
        width: '8px',
        height: '8px',
        border: '2px solid white'
    };

    return (
        <div className="relative px-4 py-2 rounded bg-gray-800 text-white text-sm border border-gray-600 shadow-lg">
            <Handle
                type={handleType}
                position={Position.Left}
                id="left"
                style={handleStyle}
                isConnectable={true}
            />
            <span className="whitespace-nowrap">{data.label}</span>
            <Handle
                type={handleType}
                position={Position.Right}
                id="right"
                style={handleStyle}
                isConnectable={true}
            />
        </div>
    );
};

export default React.memo(LabelNode);