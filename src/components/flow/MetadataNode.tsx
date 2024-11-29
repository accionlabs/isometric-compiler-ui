import React, { useState } from 'react';
import { Node, Handle, Position, NodeProps, useStore } from '@xyflow/react';
import { schemaLoader } from '@/lib/componentSchemaLib';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

interface MetadataNodeData extends Record<string, unknown> {
  componentId: string;
  type: string;
  metadata: Record<string, any>;
  isInteractive?: boolean;
}

type MetadataNodeType = Node<MetadataNodeData>;


const MetadataNode: React.FC<NodeProps<MetadataNodeType>> = ({ 
  data, 
  id,
  isConnectable = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const componentType = schemaLoader.getComponentType(data.type);

  if (!componentType || !data.metadata) {
    return null;
  }

  const name = data.metadata.name || 'Unnamed Component';
  const description = data.metadata.description || 'No description available';

  // Small, subtle handle style for connection points
  const handleStyle = {
    width: '6px',
    height: '6px',
    background: '#4F46E5',
    border: '1px solid white',
    borderRadius: '50%',
    opacity: 0.5,
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 1
    }
  };

  const additionalMetadata = componentType.fields
    .filter(field => field.name !== 'name' && field.name !== 'description')
    .map(field => ({
      field,
      value: data.metadata[field.name]
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '');

  return (
    <>
      <div 
        className="px-3 py-2 rounded-lg border bg-white shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl relative"
        onClick={() => setIsExpanded(true)}
        onMouseEnter={(e) => {
          const tooltip = document.createElement('div');
          tooltip.className = 'fixed bg-gray-900 text-white p-3 rounded text-sm z-50 max-w-xs';
          tooltip.style.left = `${e.clientX + 10}px`;
          tooltip.style.top = `${e.clientY + 10}px`;
          tooltip.id = 'metadata-tooltip';
          tooltip.innerHTML = `
            <div class="font-medium text-gray-200 mb-1">${componentType.displayName}</div>
            <div class="text-gray-400">${description}</div>
          `;
          document.body.appendChild(tooltip);
        }}
        onMouseLeave={() => {
          const tooltip = document.getElementById('metadata-tooltip');
          if (tooltip) tooltip.remove();
        }}
      >
        {/* Always visible connection points */}
        <Handle
          type="source"
          position={Position.Left}
          id={`${data.componentId}-metadata-left`}
          style={handleStyle}
          isConnectable={isConnectable && !!data.isInteractive}
        />

        <Handle
          type="source"
          position={Position.Right}
          id={`${data.componentId}-metadata-right`}
          style={handleStyle}
          isConnectable={isConnectable && !!data.isInteractive}
        />

        <Handle
          type="source"
          position={Position.Top}
          id={`${data.componentId}-metadata-top`}
          style={handleStyle}
          isConnectable={isConnectable && !!data.isInteractive}
        />

        <Handle
          type="source"
          position={Position.Bottom}
          id={`${data.componentId}-metadata-bottom`}
          style={handleStyle}
          isConnectable={isConnectable && !!data.isInteractive}
        />

        {/* Content */}
        <div className="font-medium text-gray-900">
          {name}
        </div>
      </div>

      {/* Dialog content remains the same */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {name}
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({componentType.displayName})
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Description</h3>
              <p className="text-gray-100">{description}</p>
            </div>

            {additionalMetadata.length > 0 && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Metadata</h3>
                <div className="space-y-2">
                  {additionalMetadata.map(({ field, value }) => (
                    <div key={field.name} className="flex justify-between">
                      <span className="text-gray-400">{field.label}:</span>
                      <span className="text-gray-100">
                        {field.type === 'select' 
                          ? field.options?.find(opt => opt.value === value)?.label || value
                          : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style>
        {`
          .react-flow__handle:hover {
            opacity: 1 !important;
          }
        `}
      </style>
    </>
  );
};

export default React.memo(MetadataNode);