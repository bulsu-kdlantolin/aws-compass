import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { X, Check } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { CanvasNodeData } from '../../types/aws';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';

export const ActorNode = memo((props: NodeProps) => {
  const { id, selected } = props;
  const nodeData = props.data as unknown as CanvasNodeData;
  const removeNode = useCanvasStore((s) => s.removeNode);
  const openNodeInspector = useCanvasStore((s) => s.openNodeInspector);
  const updateNodeProperties = useCanvasStore((s) => s.updateNodeProperties);
  const openContextMenu = useCanvasStore((s) => s.openContextMenu);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(
    nodeData.customTitle || nodeData.label || 'External Actor'
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openNodeInspector(id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({ x: e.clientX, y: e.clientY, type: 'node', targetId: id });
  };

  const handleCommitTitle = () => {
    if (titleDraft.trim()) {
      updateNodeProperties(id, { customTitle: titleDraft.trim(), label: titleDraft.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const actorType = nodeData.actorType || 'user-browser';
  const displayTitle = nodeData.customTitle || nodeData.label || 'External Actor';
  const roleSubtitle = nodeData.roleSubtitle || nodeData.customNotes || '';

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className="relative flex flex-col items-center group select-none cursor-pointer"
      title={`${displayTitle} · Right-click for options`}
    >
      {/* Delete Quick Button (Appears on Hover) */}
      <button
        type="button"
        onClick={handleDelete}
        style={{
          color: 'var(--aws-text-muted)',
          backgroundColor: 'var(--aws-card-bg)',
          borderColor: 'var(--aws-border)',
        }}
        className="absolute -top-2.5 -right-2 p-0.5 rounded-full border shadow-xs opacity-0 group-hover:opacity-100 hover:text-[#DD344C] hover:border-[#DD344C] transition-opacity cursor-pointer z-20"
        title="Remove actor"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Main 48x48 Icon Box */}
      <div
        className={`relative size-12 rounded-[6px] flex items-center justify-center transition-all duration-150 ${selected
            ? 'ring-2 ring-[var(--aws-brand)] shadow-md scale-105'
            : 'hover:scale-105 hover:shadow-xs'
          }`}
      >
        <AWSServiceIcon variant="actor" actorId={actorType} size={48} />

        {/* 4-Way Directional Connection Handles */}
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          isConnectable={true}
          style={{ backgroundColor: 'var(--aws-interactive)' }}
          className="!size-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Connect (Top)"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          isConnectable={true}
          style={{ backgroundColor: 'var(--aws-interactive)' }}
          className="!size-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Connect (Right)"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          isConnectable={true}
          style={{ backgroundColor: 'var(--aws-interactive)' }}
          className="!size-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Connect (Bottom)"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          isConnectable={true}
          style={{ backgroundColor: 'var(--aws-interactive)' }}
          className="!size-2.5 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Connect (Left)"
        />
      </div>

      {/* Title & Subtitle Labels */}
      <div className="mt-1.5 flex flex-col items-center max-w-[150px] text-center">
        {isEditingTitle ? (
          <div className="flex items-center gap-1 z-20">
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitTitle();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              onBlur={handleCommitTitle}
              autoFocus
              className="text-[12px] font-bold bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] border border-[var(--aws-interactive)] rounded px-1.5 py-0.5 outline-none w-32 text-center"
            />
            <button
              type="button"
              onClick={handleCommitTitle}
              className="text-[#1D8102] hover:opacity-80 p-0.5"
            >
              <Check className="size-3.5" />
            </button>
          </div>
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setTitleDraft(displayTitle);
              setIsEditingTitle(true);
            }}
            className="font-bold text-[12px] leading-[1.3] text-center break-words line-clamp-2 hover:underline decoration-dotted cursor-text text-[var(--aws-text-primary)]"
            title="Double-click to edit actor title"
          >
            {displayTitle}
          </span>
        )}

        {roleSubtitle && (
          <span className="font-mono text-[10px] leading-[1.25] text-center break-words line-clamp-2 text-[var(--aws-text-muted)] mt-0.5">
            {roleSubtitle}
          </span>
        )}
      </div>
    </div>
  );
});

ActorNode.displayName = 'ActorNode';
export default ActorNode;