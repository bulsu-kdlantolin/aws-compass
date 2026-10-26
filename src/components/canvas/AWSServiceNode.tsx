import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import type { CanvasNodeData } from '../../types/aws';
import { useCanvasStore } from '../../store/useCanvasStore';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeStatusIndicator } from '../ui/CloudscapeStatusIndicator';

export const AWSServiceNode = memo((props: NodeProps) => {
  const nodeData = props.data as unknown as CanvasNodeData;
  const { id, selected } = props;

  const isSelected = useCanvasStore((s) => s.selectedNodeId === id);
  const openInspector = useCanvasStore((s) => s.openInspector);
  const removeNode = useCanvasStore((s) => s.removeNode);

  const isCurrentSelected = selected || isSelected;

  const handleInspectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openInspector(id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  return (
    <div
      onClick={handleInspectClick}
      className="relative flex flex-col items-center group select-none cursor-pointer"
      style={{ width: '140px' }}
      title={`${nodeData.label} (${nodeData.serviceId}) - Click to inspect`}
    >
      {/* Delete button (hover only) */}
      <button
        type="button"
        onClick={handleDeleteClick}
        style={{
          backgroundColor: 'var(--aws-card-bg)',
          borderColor: 'var(--aws-border)',
          color: 'var(--aws-text-muted)',
        }}
        className="absolute -top-2 -right-2 p-0.5 rounded-full border shadow-sm opacity-0 group-hover:opacity-100 hover:text-[#DD344C] hover:border-[#DD344C] transition-opacity cursor-pointer z-10"
        title="Remove node"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Centered 48x48px Official AWS Service Icon Tile */}
      <div
        style={{
          boxShadow: isCurrentSelected
            ? '0 0 0 2px #FF9900, 0 4px 12px rgba(255, 153, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
        className={`relative w-12 h-12 rounded-[4px] flex items-center justify-center motion-safe:transition-[box-shadow,transform] duration-150 ease-out ${
          isCurrentSelected ? 'motion-safe:scale-105' : 'motion-safe:hover:scale-105'
        }`}
      >
        <AWSServiceIcon serviceId={nodeData.serviceId} size={48} variant="service" />

        {/* 4-Way Directional Connection Handles */}
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          isConnectable={true}
          style={{ backgroundColor: 'var(--aws-interactive)' }}
          className="!w-2.5 !h-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Connect (Top)"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          isConnectable={true}
          style={{ backgroundColor: 'var(--aws-interactive)' }}
          className="!w-2.5 !h-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Connect (Right)"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          isConnectable={true}
          style={{ backgroundColor: 'var(--aws-interactive)' }}
          className="!w-2.5 !h-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Connect (Bottom)"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          isConnectable={true}
          style={{ backgroundColor: 'var(--aws-interactive)' }}
          className="!w-2.5 !h-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Connect (Left)"
        />

        {/* Study status small indicator dot in corner */}
        {nodeData.status && nodeData.status !== 'not-started' && (
          <span className="absolute -bottom-1 -right-1 bg-[var(--aws-card-bg)] rounded-full p-0.5 shadow-xs">
            <CloudscapeStatusIndicator status={nodeData.status} showLabel={false} />
          </span>
        )}
      </div>

      {/* Service Title (12px bold sentence case) */}
      <div
        style={{ color: 'var(--aws-text-primary)' }}
        className="mt-2 font-bold text-[12px] leading-[1.3] text-center w-[140px] break-words line-clamp-2"
      >
        {nodeData.label}
      </div>

      {/* Resource Identifier / Subtitle (11px monospace, line-clamp-2) */}
      <div
        style={{ color: 'var(--aws-text-muted)' }}
        className="font-mono text-[11px] leading-[1.3] text-center w-[140px] break-words line-clamp-2 opacity-85 mt-0.5"
      >
        {nodeData.customNotes || nodeData.serviceId}
      </div>
    </div>
  );
});

AWSServiceNode.displayName = 'AWSServiceNode';
export default AWSServiceNode;
