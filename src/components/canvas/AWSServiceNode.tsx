import React, { memo, useState, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { X, Check } from 'lucide-react';
import type { CanvasNodeData } from '../../types/aws';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useCompassStore } from '../../store/useCompassStore';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { getAWSCategoryColor } from '../../utils/awsCategoryColors';
import { estimateSingleNodeCost } from '../../utils/costEstimator';

export const AWSServiceNode = memo((props: NodeProps) => {
  const nodeData = props.data as unknown as CanvasNodeData;
  const { id, selected } = props;

  const isSelected = useCanvasStore((s) => s.selectedNodeId === id);
  const openNodeInspector = useCanvasStore((s) => s.openNodeInspector);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const updateNodeProperties = useCanvasStore((s) => s.updateNodeProperties);
  const openContextMenu = useCanvasStore((s) => s.openContextMenu);
  const nodes = useCanvasStore((s) => s.nodes);
  const canvasWorkloadTier = useCanvasStore((s) => s.canvasWorkloadTier);
  const theme = useCompassStore((s) => s.theme);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(nodeData.customTitle || nodeData.label);
  const [subtitleDraft, setSubtitleDraft] = useState(nodeData.roleSubtitle || nodeData.customNotes || '');

  const isCurrentSelected = selected || isSelected;

  // Live node cost estimate
  const nodeCost = useMemo(() => {
    const currentNodeItem = nodes.find((n) => n.id === id);
    if (!currentNodeItem) return null;
    return estimateSingleNodeCost(currentNodeItem, nodes, canvasWorkloadTier);
  }, [id, nodes, canvasWorkloadTier]);

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

  const categoryColor = getAWSCategoryColor(nodeData.category || 'Compute', theme);

  const envColorMap: Record<string, string> = {
    Prod: '#EF4444',
    Staging: '#ED7100',
    Dev: '#0972D3',
  };

  const displaySubtitle =
    nodeData.roleSubtitle ||
    nodeData.customNotes ||
    (nodeData.isActor ? 'External Actor' : nodeData.serviceId || nodeData.category || 'AWS Service');

  return (
    <div
      onClick={handleInspectClick}
      onContextMenu={handleContextMenu}
      className={`group relative w-[190px] rounded-[12px] p-2.5 bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-md border select-none cursor-pointer transition-all duration-150 ${isCurrentSelected
          ? 'ring-2 ring-[#FF9900]/25 !border-[#FF9900] shadow-[0_0_20px_rgba(255,153,0,0.18)]'
          : 'border-slate-200/90 dark:border-white/[0.09] shadow-[0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] hover:border-slate-300 dark:hover:border-white/20'
        }`}
      title={`${nodeData.customTitle || nodeData.label} — Click to inspect, double-click text to edit`}
    >
        {/* Top Accent Hairline Tinted with Official AWS Category Color */}
        <div
          style={{ backgroundColor: categoryColor }}
          className="absolute -top-px left-3 right-3 h-[2px] rounded-full opacity-90"
          aria-hidden="true"
        />

        {/* Delete button (hover only) */}
        <button
          type="button"
          onClick={handleDeleteClick}
          className="absolute -top-2 -right-2 p-1 rounded-full bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-white/[0.1] shadow-xs opacity-0 group-hover:opacity-100 hover:text-[#EF4444] hover:border-[#EF4444]/40 text-slate-400 transition-opacity cursor-pointer z-20"
          title="Remove node from canvas"
        >
          <X className="w-3 h-3" />
        </button>

          {/* 4-Way Directional Connection Handles */}
          <Handle
            type="source"
            position={Position.Top}
            id="top"
            isConnectable={true}
            className="!w-2.5 !h-2.5 !rounded-full !border-2 !border-white dark:!border-[#131B2E] !bg-[#0972D3] dark:!bg-[#539FE5] opacity-0 group-hover:opacity-100 hover:scale-125 transition-all"
            title="Connect (Top)"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            isConnectable={true}
            className="!w-2.5 !h-2.5 !rounded-full !border-2 !border-white dark:!border-[#131B2E] !bg-[#0972D3] dark:!bg-[#539FE5] opacity-0 group-hover:opacity-100 hover:scale-125 transition-all"
            title="Connect (Right)"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom"
            isConnectable={true}
            className="!w-2.5 !h-2.5 !rounded-full !border-2 !border-white dark:!border-[#131B2E] !bg-[#0972D3] dark:!bg-[#539FE5] opacity-0 group-hover:opacity-100 hover:scale-125 transition-all"
            title="Connect (Bottom)"
          />
          <Handle
            type="source"
            position={Position.Left}
            id="left"
            isConnectable={true}
            className="!w-2.5 !h-2.5 !rounded-full !border-2 !border-white dark:!border-[#131B2E] !bg-[#0972D3] dark:!bg-[#539FE5] opacity-0 group-hover:opacity-100 hover:scale-125 transition-all"
            title="Connect (Left)"
          />

          {/* Card Header: 36x36 Icon + Title & Subtitle */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[8px] bg-slate-50 dark:bg-white/[0.04] p-0.5 border border-slate-200/60 dark:border-white/[0.06] shadow-2xs shrink-0 flex items-center justify-center">
              {nodeData.isActor ? (
                <AWSServiceIcon
                  variant="actor"
                  actorId={nodeData.actorType || 'user-browser'}
                  size={32}
                />
              ) : (
                <AWSServiceIcon
                  serviceId={nodeData.serviceId}
                  category={nodeData.category}
                  size={32}
                  variant="service"
                />
              )}
            </div>

              <div className="min-w-0 flex-1">
                {isEditingTitle ? (
                    <div className="flex items-center gap-1">
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
                        className="w-full text-[12px] font-semibold bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 border border-[#0972D3] dark:border-[#539FE5] rounded px-1 py-0.5 outline-none shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={handleCommitTitle}
                        className="text-[#16A34A] hover:opacity-80 p-0.5"
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
                      className="text-[12.5px] font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate hover:underline decoration-dotted cursor-text"
                      title="Double-click to edit title"
                    >
                      {nodeData.customTitle || nodeData.label}
                    </div>
          )}

                  {isEditingSubtitle ? (
                      <div className="flex items-center gap-1 mt-0.5">
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
                          className="w-full text-[11px] font-mono bg-white dark:bg-[#0B0F19] text-slate-500 dark:text-slate-400 border border-[#0972D3] dark:border-[#539FE5] rounded px-1 py-0.5 outline-none shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={handleCommitSubtitle}
                          className="text-[#16A34A] hover:opacity-80 p-0.5"
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
                        className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5 hover:underline decoration-dotted cursor-text"
                        title="Double-click to edit subtitle / role"
                      >
                        {displaySubtitle}
                      </div>
                  )}
                </div>
              </div>

              {/* Bottom Micro-Footer */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-[10px] font-mono">
                {/* Left: Environment or AZ Badge */}
                <div className="flex items-center gap-1 min-w-0 truncate">
                  {nodeData.env && nodeData.env !== 'None' ? (
                    <span
                      style={{ backgroundColor: envColorMap[nodeData.env] || '#64748B' }}
                      className="text-[9px] font-bold text-white uppercase px-1 py-0.2 rounded-[3px] tracking-wider shrink-0"
                    >
                      {nodeData.env}
                    </span>
                  ) : nodeData.az ? (
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {nodeData.az}
                    </span>
                  ) : nodeData.metadataPill ? (
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {nodeData.metadataPill}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 truncate">
                      {nodeData.category || 'Cloud'}
                    </span>
                  )}
                </div>

                {/* Right: Live Node Cost or Tier Badge */}
                <div className="shrink-0 pl-1">
                  {nodeCost && nodeCost.monthlyCost > 0 ? (
                    <span className="font-semibold text-[#FF9900] tabular-nums">
                      ~${nodeCost.monthlyCost}/mo
                    </span>
                  ) : nodeCost && nodeCost.effectiveTier === 'free' ? (
                    <span className="text-slate-400 dark:text-slate-500">Free</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">T1</span>
                  )}
                </div>
              </div>
            </div>
            );
});

            AWSServiceNode.displayName = 'AWSServiceNode';
            export default AWSServiceNode;
