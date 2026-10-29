import React, { memo, useState } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import { X, Check } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useCompassStore } from '../../store/useCompassStore';
import type { CanvasNodeData } from '../../types/aws';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';

interface BoundaryStyleRule {
  label: string;
  groupId: string;
  dashed: boolean;
  borderLight: string;
  borderDark: string;
  bgLight?: string;
  bgDark?: string;
  textLight: string;
  textDark: string;
}

const BOUNDARY_RULES: Record<string, BoundaryStyleRule> = {
  'aws-cloud': {
    label: 'AWS Cloud',
    groupId: 'aws-cloud',
    dashed: false,
    borderLight: '#232F3E',
    borderDark: '#EAEDED',
    textLight: '#232F3E',
    textDark: '#EAEDED',
  },
  region: {
    label: 'Region',
    groupId: 'region',
    dashed: true,
    borderLight: '#545B64',
    borderDark: '#879596',
    textLight: '#545B64',
    textDark: '#879596',
  },
  vpc: {
    label: 'VPC',
    groupId: 'vpc',
    dashed: false,
    borderLight: '#8C4FFF',
    borderDark: '#8C4FFF',
    bgLight: 'rgba(140, 79, 255, 0.03)',
    bgDark: 'rgba(140, 79, 255, 0.05)',
    textLight: '#8C4FFF',
    textDark: '#8C4FFF',
  },
  'public-subnet': {
    label: 'Public subnet',
    groupId: 'public-subnet',
    dashed: false,
    borderLight: '#1D8102',
    borderDark: '#1D8102',
    bgLight: 'rgba(29, 129, 2, 0.05)',
    bgDark: 'rgba(29, 129, 2, 0.05)',
    textLight: '#1D8102',
    textDark: '#1D8102',
  },
  'private-subnet': {
    label: 'Private subnet',
    groupId: 'private-subnet',
    dashed: false,
    borderLight: '#0073BB',
    borderDark: '#0073BB',
    bgLight: 'rgba(0, 115, 187, 0.05)',
    bgDark: 'rgba(0, 115, 187, 0.05)',
    textLight: '#0073BB',
    textDark: '#0073BB',
  },
  'security-group': {
    label: 'Security group',
    groupId: 'security-group',
    dashed: true,
    borderLight: '#DD344C',
    borderDark: '#DD344C',
    bgLight: 'rgba(221, 52, 76, 0.03)',
    bgDark: 'rgba(221, 52, 76, 0.05)',
    textLight: '#DD344C',
    textDark: '#DD344C',
  },
  'auto-scaling-group': {
    label: 'Auto scaling group',
    groupId: 'auto-scaling-group',
    dashed: true,
    borderLight: '#ED7100',
    borderDark: '#ED7100',
    bgLight: 'rgba(237, 113, 0, 0.03)',
    bgDark: 'rgba(237, 113, 0, 0.05)',
    textLight: '#ED7100',
    textDark: '#ED7100',
  },
  serverless: {
    label: 'Managed Serverless',
    groupId: 'serverless',
    dashed: true,
    borderLight: '#E7157B',
    borderDark: '#E7157B',
    bgLight: 'rgba(231, 21, 123, 0.03)',
    bgDark: 'rgba(231, 21, 123, 0.05)',
    textLight: '#E7157B',
    textDark: '#E7157B',
  },
  'data-subnet': {
    label: 'Isolated Data Subnet',
    groupId: 'private-subnet',
    dashed: false,
    borderLight: '#3B48CC',
    borderDark: '#3B48CC',
    bgLight: 'rgba(59, 72, 204, 0.05)',
    bgDark: 'rgba(59, 72, 204, 0.05)',
    textLight: '#3B48CC',
    textDark: '#3B48CC',
  },
  'corporate-datacenter': {
    label: 'Corporate Data Center',
    groupId: 'corporate-datacenter',
    dashed: true,
    borderLight: '#545B64',
    borderDark: '#879596',
    bgLight: 'rgba(84, 91, 100, 0.03)',
    bgDark: 'rgba(135, 149, 150, 0.05)',
    textLight: '#545B64',
    textDark: '#879596',
  },
};

export const AWSGroupNode = memo((props: NodeProps) => {
  const { id, selected } = props;
  const nodeData = props.data as unknown as CanvasNodeData;
  const removeNode = useCanvasStore((s) => s.removeNode);
  const openNodeInspector = useCanvasStore((s) => s.openNodeInspector);
  const updateNodeProperties = useCanvasStore((s) => s.updateNodeProperties);
  const openContextMenu = useCanvasStore((s) => s.openContextMenu);
  const theme = useCompassStore((s) => s.theme);

  const rawType = (nodeData.boundaryType || 'aws-cloud').toLowerCase();
  const rule = BOUNDARY_RULES[rawType] || BOUNDARY_RULES['aws-cloud'];

  const customBorder = nodeData.accentColor;
  const borderColor = customBorder || (theme === 'dark' ? rule.borderDark : rule.borderLight);
  const textColor = customBorder || (theme === 'dark' ? rule.textDark : rule.textLight);
  const bgColor = theme === 'dark' ? rule.bgDark || 'transparent' : rule.bgLight || 'transparent';

  const borderStyle = nodeData.borderStyle || (rule.dashed ? 'dashed' : 'solid');

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(nodeData.boundaryLabel || nodeData.label || rule.label);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditingLabel) {
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

  const handleCommitLabel = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    updateNodeProperties(id, {
      boundaryLabel: labelDraft.trim() || rule.label,
      label: labelDraft.trim() || rule.label,
    });
    setIsEditingLabel(false);
  };

  const nodeWidth = (props.width as number) || nodeData.width || 540;
  const nodeHeight = (props.height as number) || nodeData.height || 340;

  return (
    <div
      onContextMenu={handleContextMenu}
      style={{
        borderColor,
        borderWidth: '1.5px',
        borderStyle,
        backgroundColor: bgColor,
        width: `${nodeWidth}px`,
        height: `${nodeHeight}px`,
        pointerEvents: 'none',
      }}
      className={`relative rounded - none select - none transition - shadow ${ selected? 'ring-2 ring-[var(--aws-brand)] shadow-lg': '' }`}
    >
      {/* NodeResizer Controls (minWidth=220, minHeight=160) */}
      <div className="pointer-events-auto">
        <NodeResizer
          minWidth={220}
          minHeight={160}
          isVisible={selected}
          lineClassName="!border-[var(--aws-brand)]"
          handleClassName="!w-2.5 !h-2.5 !bg-[var(--aws-brand)] !border-none !rounded-none shadow-xs"
        />
      </div>

      {/* Flush Top-Left Official Group Badge */}
      <div
        onClick={handleHeaderClick}
        style={{
          borderBottomColor: borderColor,
          borderRightColor: borderColor,
          backgroundColor: 'var(--aws-card-bg)',
          color: textColor,
        }}
        className="absolute top-0 left-0 z-10 h-8 px-2.5 flex items-center gap-2 border-b border-r text-[12px] leading-[16px] font-bold font-sans pointer-events-auto cursor-pointer shadow-xs select-none max-w-[90%]"
      >
        <AWSServiceIcon groupId={rule.groupId} size={20} variant="group" />

        {isEditingLabel ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitLabel();
                if (e.key === 'Escape') setIsEditingLabel(false);
              }}
              onBlur={() => handleCommitLabel()}
              autoFocus
              className="text-[12px] font-bold bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] border border-[var(--aws-interactive)] rounded px-1.5 py-0.5 outline-none"
            />
            <button
              type="button"
              onClick={handleCommitLabel}
              className="text-[#1D8102] hover:opacity-80 p-0.5"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setLabelDraft(nodeData.boundaryLabel || nodeData.label || rule.label);
              setIsEditingLabel(true);
            }}
            className="truncate hover:underline decoration-dotted cursor-text"
            title="Double-click to edit boundary label"
          >
            {nodeData.boundaryLabel || nodeData.label || rule.label}
          </span>
        )}

        {/* CIDR / Region tag badge in top-left tab */}
        {nodeData.cidr && (
          <span className="font-mono text-[10px] text-[var(--aws-text-muted)] bg-[var(--aws-page-bg)] border border-[var(--aws-border)] px-1.5 py-0.2 rounded shrink-0">
            {nodeData.cidr}
          </span>
        )}

        {/* Delete Group Button */}
        <button
          type="button"
          onClick={handleDelete}
          style={{ color: 'var(--aws-text-muted)' }}
          className="ml-1 p-0.5 hover:text-[#DD344C] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
          title="Remove group boundary"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

AWSGroupNode.displayName = 'AWSGroupNode';
export default AWSGroupNode;
