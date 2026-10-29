import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { X, Check } from 'lucide-react';
import type { CanvasNodeData } from '../../types/aws';
import { useCanvasStore } from '../../store/useCanvasStore';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeStatusIndicator } from '../ui/CloudscapeStatusIndicator';

export const AWSServiceNode = memo((props: NodeProps) => {
  const nodeData = props.data as unknown as CanvasNodeData;
  const { id, selected } = props;

  const isSelected = useCanvasStore((s) => s.selectedNodeId === id);
  const openNodeInspector = useCanvasStore((s) => s.openNodeInspector);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const updateNodeProperties = useCanvasStore((s) => s.updateNodeProperties);
  const openContextMenu = useCanvasStore((s) => s.openContextMenu);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(nodeData.customTitle || nodeData.label);
  const [subtitleDraft, setSubtitleDraft] = useState(nodeData.roleSubtitle || nodeData.customNotes || '');

  const isCurrentSelected = selected || isSelected;

  const handleInspectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditingTitle && !isEditingSubtitle) {
      openNodeInspector(id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'node',
      targetId: id,
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const handleCommitTitle = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    updateNodeProperties(id, {
      customTitle: titleDraft.trim() || nodeData.label,
      label: titleDraft.trim() || nodeData.label,
    });
    setIsEditingTitle(false);
  };

  const handleCommitSubtitle = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    updateNodeProperties(id, {
      roleSubtitle: subtitleDraft.trim(),
      customNotes: subtitleDraft.trim(),
    });
    setIsEditingSubtitle(false);
  };

  const envColorMap: Record<string, string> = {
    Prod: '#DD344C',
    Staging: '#ED7100',
    Dev: '#0972D3',
  };

  return (
    <div
      onClick={handleInspectClick}
      onContextMenu={handleContextMenu}
      className="relative flex flex-col items-center group select-none cursor-pointer"
      style={{ width: '144px' }}
      title={`${nodeData.customTitle || nodeData.label} - Click to inspect, double-click text to edit`}
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
        className="absolute -top-2.5 -right-2 p-0.5 rounded-full border shadow-sm opacity-0 group-hover:opacity-100 hover:text-[#DD344C] hover:border-[#DD344C] transition-opacity cursor-pointer z-20"
        title="Remove node"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Badges Bar (Environment & AZ) */}
      <div className="flex items-center gap-1 mb-1 pointer-events-none">
        {nodeData.env && nodeData.env !== 'None' && (
          <span
            style={{ backgroundColor: envColorMap[nodeData.env] || '#545B64' }}
            className="text-[9px] font-bold text-white uppercase px-1.5 py-0.2 rounded-[3px] tracking-wider shadow-xs"
          >
            {nodeData.env}
          </span>
        )}
        {nodeData.az && (
          <span className="text-[9px] font-mono text-[var(--aws-text-muted)] bg-[var(--aws-card-bg)] px-1 py-0.2 rounded border border-[var(--aws-border)] shadow-xs">
            {nodeData.az}
          </span>
        )}
      </div>

      {/* Centered 48x48px Official AWS Service or Actor Icon Tile */}
      <div
        style={{
          boxShadow: isCurrentSelected
            ? '0 0 0 2px #FF9900, 0 4px 12px rgba(255, 153, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
        className={`relative w-12 h-12 rounded-[4px] flex items-center justify-center motion-safe:transition-[box-shadow,transform] duration-150 ease-out ${isCurrentSelected ? 'motion-safe:scale-105' : 'motion-safe:hover:scale-105'
          }`}
      >
        {nodeData.isActor ? (
          <AWSServiceIcon
            variant="actor"
            actorId={nodeData.actorType || 'user-browser'}
            size={48}
          />
        ) : (
          <AWSServiceIcon serviceId={nodeData.serviceId} size={48} variant="service" />
        )}

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
          {!nodeData.isActor && nodeData.status && nodeData.status !== 'not-started' && (
        <span className="absolute -bottom-1 -right-1 bg-[var(--aws-card-bg)] rounded-full p-0.5 shadow-xs">
          <CloudscapeStatusIndicator status={nodeData.status} showLabel={false} />
        </span>
        )}
      </div>

        {/* Service Title (12px bold sentence case, double-click inline edit) */}
        <div className="mt-2 w-full flex justify-center">
          {isEditingTitle ? (
            <div className="flex items-center gap-1 w-full px-1">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                onBlur={() => handleCommitTitle()}
                autoFocus
                className="w-full text-center text-[12px] font-bold bg-[var(--aws-card-bg)] text-[var(--aws-text-primary)] border border-[var(--aws-interactive)] rounded px-1 py-0.5 outline-none shadow-xs"
              />
              <button
                type="button"
                onClick={handleCommitTitle}
                className="text-[#1D8102] hover:opacity-80 p-0.5"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onDoubleClick={(e) => {
                e.stopPropagation();
                setTitleDraft(nodeData.customTitle || nodeData.label);
                setIsEditingTitle(true);
              }}
              style={{ color: 'var(--aws-text-primary)' }}
              className="font-bold text-[12px] leading-[1.3] text-center w-[140px] break-words line-clamp-2 hover:underline decoration-dotted cursor-text"
              title="Double-click to edit title"
            >
              {nodeData.customTitle || nodeData.label}
            </div>
          )}
        </div>

          {/* Resource Identifier / Subtitle (11px monospace, line-clamp-2, double-click inline edit) */}
          <div className="mt-0.5 w-full flex justify-center">
            {isEditingSubtitle ? (
              <div className="flex items-center gap-1 w-full px-1">
                <input
                  type="text"
                  value={subtitleDraft}
                  onChange={(e) => setSubtitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommitSubtitle();
                    if (e.key === 'Escape') setIsEditingSubtitle(false);
                  }}
                  onBlur={() => handleCommitSubtitle()}
                  autoFocus
                  className="w-full text-center text-[11px] font-mono bg-[var(--aws-card-bg)] text-[var(--aws-text-muted)] border border-[var(--aws-interactive)] rounded px-1 py-0.5 outline-none shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleCommitSubtitle}
                  className="text-[#1D8102] hover:opacity-80 p-0.5"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setSubtitleDraft(nodeData.roleSubtitle || nodeData.customNotes || '');
                  setIsEditingSubtitle(true);
                }}
                style={{ color: 'var(--aws-text-muted)' }}
                className="font-mono text-[11px] leading-[1.3] text-center w-[140px] break-words line-clamp-2 opacity-85 hover:underline decoration-dotted cursor-text"
                title="Double-click to edit role / subtitle"
              >
                {nodeData.roleSubtitle || nodeData.customNotes || (nodeData.isActor ? 'Actor' : nodeData.serviceId)}
              </div>
            )}
          </div>

          {/* Custom Metadata Pill (e.g. 10.0.1.24 or kms:Encrypted) */}
          {nodeData.metadataPill && (
            <div className="mt-1">
              <span className="text-[10px] font-mono text-[var(--aws-text-muted)] bg-[var(--aws-card-bg)] px-1.5 py-0.5 rounded-[4px] border border-[var(--aws-border)] shadow-xs max-w-[130px] truncate block text-center">
                {nodeData.metadataPill}
              </span>
            </div>
          )}
        </div>
        );
});

        AWSServiceNode.displayName = 'AWSServiceNode';
        export default AWSServiceNode;
