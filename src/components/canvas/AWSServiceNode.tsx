import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Check, X } from 'lucide-react';
import type { CanvasNodeData } from '../../types/aws';
import { useCanvasStore } from '../../store/useCanvasStore';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';

export const AWSServiceNode = memo((props: NodeProps) => {
  const nodeData = props.data as unknown as CanvasNodeData;
  const { id, selected } = props;

  const isSelected = useCanvasStore((state) => state.selectedNodeId === id);
  const openNodeInspector = useCanvasStore((state) => state.openNodeInspector);
  const removeNode = useCanvasStore((state) => state.removeNode);
  const updateNodeProperties = useCanvasStore((state) => state.updateNodeProperties);
  const openContextMenu = useCanvasStore((state) => state.openContextMenu);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(nodeData.customTitle || nodeData.label);
  const isCurrentSelected = selected || isSelected;
  const title = nodeData.customTitle || nodeData.label;

  const handleInspectClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isEditingTitle) openNodeInspector(id);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openContextMenu({ x: event.clientX, y: event.clientY, type: 'node', targetId: id });
  };

  const handleCommitTitle = (event?: React.SyntheticEvent) => {
    event?.stopPropagation();
    const nextTitle = titleDraft.trim() || nodeData.label;
    updateNodeProperties(id, { customTitle: nextTitle, label: nextTitle });
    setIsEditingTitle(false);
  };

  return (
    <div
      onClick={handleInspectClick}
      onContextMenu={handleContextMenu}
      className="group relative flex w-[156px] flex-col items-center select-none"
      title={`${title} — Click to inspect, double-click the name to edit`}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          removeNode(id);
        }}
        className="absolute -right-1 -top-1 z-20 rounded-full border border-[var(--aws-border)] bg-[var(--aws-popover-bg)] p-1 text-[var(--aws-text-muted)] opacity-0 shadow-xs transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:text-[#EF4444] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aws-interactive)]"
        title="Remove service from canvas"
        aria-label={`Remove ${title} from canvas`}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div
        className={`relative flex size-12 items-center justify-center rounded-[6px] transition-[transform,box-shadow] duration-150 ${
          isCurrentSelected ? 'scale-105 ring-2 ring-[var(--aws-brand)] shadow-md' : 'hover:scale-105 hover:shadow-xs'
        }`}
      >
        {nodeData.isActor ? (
          <AWSServiceIcon
            variant="actor"
            actorId={nodeData.actorType || 'user-browser'}
            size={48}
          />
        ) : (
          <AWSServiceIcon
            serviceId={nodeData.serviceId}
            category={nodeData.category}
            size={48}
            variant="service"
          />
        )}

        {([Position.Top, Position.Right, Position.Bottom, Position.Left] as const).map((position) => (
          <Handle
            key={position}
            type="source"
            position={position}
            id={position}
            isConnectable
            style={{ backgroundColor: 'var(--aws-interactive)' }}
            className="!size-2.5 !rounded-full !border-2 !border-[var(--aws-canvas-bg)] opacity-0 transition-opacity group-hover:opacity-100"
            title={`Connect (${position})`}
          />
        ))}
      </div>

      <div className="mt-1.5 flex max-w-[150px] flex-col items-center text-center">
        {isEditingTitle ? (
          <div className="z-20 flex items-center gap-1">
            <input
              type="text"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCommitTitle();
                if (event.key === 'Escape') setIsEditingTitle(false);
              }}
              onBlur={() => handleCommitTitle()}
              autoFocus
              aria-label="Service name"
              className="w-32 rounded border border-[var(--aws-interactive)] bg-[var(--aws-page-bg)] px-1.5 py-0.5 text-center text-[12px] font-bold text-[var(--aws-text-primary)] outline-none"
            />
            <button
              type="button"
              onClick={handleCommitTitle}
              className="rounded p-1 text-[var(--aws-status-success)] hover:opacity-80"
              aria-label="Save service name"
            >
              <Check className="size-3.5" />
            </button>
          </div>
        ) : (
          <span
            onDoubleClick={(event) => {
              event.stopPropagation();
              setTitleDraft(title);
              setIsEditingTitle(true);
            }}
            className={`line-clamp-2 break-words text-center text-[12px] font-bold leading-[1.3] hover:underline decoration-dotted cursor-text ${
              isCurrentSelected ? 'text-[var(--aws-interactive)]' : 'text-[var(--aws-text-primary)]'
            }`}
            title="Double-click to edit service name"
          >
            {title}
          </span>
        )}
      </div>
    </div>
  );
});

AWSServiceNode.displayName = 'AWSServiceNode';
export default AWSServiceNode;
