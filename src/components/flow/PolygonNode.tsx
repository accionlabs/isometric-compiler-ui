import React, { memo } from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';

interface Point {
  x: number;
  y: number;
}

export interface PolygonNodeData extends Record<string, unknown> {
  points: Point[];
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  showHandles?: boolean;
  handlePositions?: Position[];
}

type PolygonNodeType = Node<PolygonNodeData>;

const PolygonNode: React.FC<NodeProps<PolygonNodeType>> = ({ 
  data,
  isConnectable = true 
}) => {
  // Extract properties from data with defaults
  const {
    points,
    color = '#1a192b',
    strokeColor = '#222',
    strokeWidth = 1,
    showHandles = true,
    handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left]
  } = data;

  // Convert points array to SVG polygon points string
  const pointsString = points
    .map(point => `${point.x},${point.y}`)
    .join(' ');

  return (
    <div className="w-full h-full min-w-[50px] min-h-[50px]">
      {/* Handles */}
      {showHandles && handlePositions.map((position) => (
        <Handle
          key={position}
          type="source"
          position={position}
          isConnectable={isConnectable}
          className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full"
          style={{ opacity: isConnectable ? 1 : 0.5 }}
        />
      ))}
      
      {/* SVG Container */}
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <polygon
          points={pointsString}
          fill={color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className="transition-colors duration-200 hover:fill-opacity-80"
        />
      </svg>
    </div>
  );
};

// Memoize the component for better performance
export default memo(PolygonNode);