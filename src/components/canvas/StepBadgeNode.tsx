import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { X, Lock, AlertTriangle, Check } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { CanvasNodeData, StepBadgeColor } from '../../types/aws';

export const StepBadgeNode = memo((props: NodeProps) => {
  const { id, selected } = props;
  const nodeData = props.data as unknown as CanvasNodeData;
  const removeNode = useCanvasStore((s) => s.removeNode);
  const openNodeInspector = useCanvasStore((s) => s.openNodeInspector);
  const updateNodeProperties = useCanvasStore((s) => s.updateNodeProperties);

  const stepType = nodeData.stepType || 'flow-step';
  const stepNumber = nodeData.stepNumber ?? 1;
  const stepColor: StepBadgeColor = nodeData.stepColor || 'orange';
  const caption = nodeData.stepCaption || '';

  const [isEditing, setIsEditing] = useState(false);
  const [numDraft, setNumDraft] = useState(String(stepNumber));
  const [captionDraft, setCaptionDraft] = useState(caption);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openNodeInspector(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const handleCommitEdit = () => {
    const parsedNum = parseInt(numDraft, 10);
    updateNodeProperties(id, {
      stepNumber: isNaN(parsedNum) ? stepNumber : parsedNum,
      stepCaption: captionDraft.trim(),
    });
    setIsEditing(false);
  };

  // Color mappings for circular badge
  const badgeColorClasses: Record<StepBadgeColor, string> = {
    orange: 'bg-[#FF9900] text-[#0F141A]',
    blue: 'bg-[#0972D3] dark:bg-[#539FE5] text-white',
    green: 'bg-[#1D8102] dark:bg-[#2EA043] text-white',
    crimson: 'bg-[#DD344C] text-white',
  };

  return (
    <div
      onClick={handleClick}
      className="relative flex items-center gap-1.5 group select-none cursor-pointer"
      title="Step Marker · Double-click to edit"
    >
      {/* Delete Quick Button (on Hover) */}
      <button
        type="button"
        onClick={handleDelete}
        style={{
          color: 'var(--aws-text-muted)',
          backgroundColor: 'var(--aws-card-bg)',
          borderColor: 'var(--aws-border)',
        }}
        className="absolute -top-2.5 -right-2 p-0.5 rounded-full border shadow-xs opacity-0 group-hover:opacity-100 hover:text-[#DD344C] hover:border-[#DD344C] transition-opacity cursor-pointer z-20"
        title="Remove marker"
      >
        <X className="w-3 h-3" />
      </button>

      {/* 4 Connection Handles for Wiring Steps into Flows */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        isConnectable={true}
        style={{ backgroundColor: 'var(--aws-interactive)' }}
        className="!size-2 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={true}
        style={{ backgroundColor: 'var(--aws-interactive)' }}
        className="!size-2 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={true}
        style={{ backgroundColor: 'var(--aws-interactive)' }}
        className="!size-2 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        isConnectable={true}
        style={{ backgroundColor: 'var(--aws-interactive)' }}
        className="!size-2 !border-2 !border-[var(--aws-card-bg)] !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* 1. Numbered Flow Step Marker (24x24px circular badge) */}
      {stepType === 'flow-step' && (
        <div className="flex items-center gap-1.5">
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setNumDraft(String(stepNumber));
              setCaptionDraft(caption);
              setIsEditing(true);
            }}
            className={`size-6 rounded-full flex items-center justify-center font-mono font-bold text-[12px] shadow-sm transition-transform ${
              badgeColorClasses[stepColor]
            } ${selected ? 'ring-2 ring-[var(--aws-brand)] scale-110' : 'hover:scale-105'}`}
          >
            {stepNumber}
          </div>

          {/* Optional Inline Caption or Editing Fields */}
          {isEditing ? (
            <div
              className="flex items-center gap-1 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="number"
                min="1"
                max="99"
                value={numDraft}
                onChange={(e) => setNumDraft(e.target.value)}
                className="w-10 h-6 px-1 text-[11px] font-mono font-bold bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] border border-[var(--aws-interactive)] rounded text-center outline-none"
              />
              <input
                type="text"
                placeholder="Caption..."
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="w-24 h-6 px-1.5 text-[11px] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] border border-[var(--aws-interactive)] rounded outline-none"
              />
              <button
                type="button"
                onClick={handleCommitEdit}
                className="text-[#1D8102] hover:opacity-80 p-0.5"
              >
                <Check className="size-3.5" />
              </button>
            </div>
          ) : (
            caption && (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setCaptionDraft(caption);
                  setIsEditing(true);
                }}
                className="text-[10px] font-medium text-[var(--aws-text-muted)] bg-[var(--aws-card-bg)] border border-[var(--aws-border)] px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap"
              >
                {caption}
              </span>
            )
          )}
        </div>
      )}

      {/* 2. TLS / mTLS Termination Badge */}
      {stepType === 'tls-badge' && (
        <div
          className={`h-6 px-2 rounded-[4px] bg-[#0972D3] dark:bg-[#539FE5] text-white flex items-center gap-1.5 text-[10px] font-semibold font-mono shadow-xs transition-transform ${
            selected ? 'ring-2 ring-[var(--aws-brand)] scale-105' : 'hover:scale-105'
          }`}
        >
          <Lock className="size-3" />
          <span>{caption || 'TLS 1.3 / mTLS'}</span>
        </div>
      )}

      {/* 3. SPOF / Risk Warning Pin */}
      {stepType === 'risk-pin' && (
        <div
          className={`h-6 px-2 rounded-[4px] bg-[#DD344C] text-white flex items-center gap-1.5 text-[10px] font-bold shadow-sm transition-transform ${
            selected ? 'ring-2 ring-white scale-105' : 'hover:scale-105'
          }`}
        >
          <AlertTriangle className="size-3.5" />
          <span>{caption || 'SPOF / Risk Pin'}</span>
        </div>
      )}
    </div>
  );
});

StepBadgeNode.displayName = 'StepBadgeNode';
export default StepBadgeNode;

