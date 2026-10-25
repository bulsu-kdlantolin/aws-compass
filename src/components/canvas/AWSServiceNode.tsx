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
      style={{ width: '100px' }}
      title={`${nodeData.label} (${nodeData.serviceId}) - Click to inspect`}
    >
      {/* 4-Way Hover-Only Connection Handles */}
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          top: '-4px',
          backgroundColor: 'var(--aws-interactive)',
        }}
        className="!w-2.5 !h-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        title="Connect input (Top)"
      />

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          right: '-4px',
          top: '24px',
          backgroundColor: 'var(--aws-interactive)',
        }}
        className="!w-2.5 !h-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        title="Connect output (Right)"
      />

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          bottom: '24px',
          backgroundColor: 'var(--aws-interactive)',
        }}
        className="!w-2.5 !h-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        title="Connect output (Bottom)"
      />

      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          left: '-4px',
          top: '24px',
          backgroundColor: 'var(--aws-interactive)',
        }}
        className="!w-2.5 !h-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        title="Connect input (Left)"
      />

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
        className={`relative w-12 h-12 rounded-[4px] flex items-center justify-center transition-all ${
          isCurrentSelected ? 'scale-105' : 'hover:scale-105'
        }`}
      >
        <AWSServiceIcon serviceId={nodeData.serviceId} size={48} variant="service" />

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
        className="mt-2 font-bold text-[12px] leading-[16px] text-center max-w-[110px] break-words line-clamp-2"
      >
        {nodeData.label}
      </div>

      {/* Resource Identifier (11px monospace) */}
      <div
        style={{ color: 'var(--aws-text-muted)' }}
        className="font-mono text-[11px] leading-[14px] text-center max-w-[110px] truncate opacity-85"
      >
        {nodeData.customNotes ? nodeData.customNotes.slice(0, 18) : nodeData.serviceId}
      </div>
    </div>
  );
});

AWSServiceNode.displayName = 'AWSServiceNode';
export default AWSServiceNode;
