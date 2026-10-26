import React, { memo } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import { X } from 'lucide-react';
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
};

export const AWSGroupNode = memo((props: NodeProps) => {
  const { id, selected } = props;
  const nodeData = props.data as unknown as CanvasNodeData;
  const removeNode = useCanvasStore((s) => s.removeNode);
  const theme = useCompassStore((s) => s.theme);

  const rawType = (nodeData.boundaryType || 'aws-cloud').toLowerCase();
  const rule = BOUNDARY_RULES[rawType] || BOUNDARY_RULES['aws-cloud'];

  const borderColor = theme === 'dark' ? rule.borderDark : rule.borderLight;
  const textColor = theme === 'dark' ? rule.textDark : rule.textLight;
  const bgColor = theme === 'dark' ? rule.bgDark || 'transparent' : rule.bgLight || 'transparent';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const nodeWidth = (props.width as number) || nodeData.width || 540;
  const nodeHeight = (props.height as number) || nodeData.height || 340;

  return (
    <div
      style={{
        borderColor,
        borderWidth: '1.5px',
        borderStyle: rule.dashed ? 'dashed' : 'solid',
        backgroundColor: bgColor,
        width: `${nodeWidth}px`,
        height: `${nodeHeight}px`,
        pointerEvents: 'none',
      }}
      className={`relative min-w-[200px] min-h-[120px] rounded-none transition-colors group select-none ${
        selected ? 'ring-2 ring-[var(--aws-brand)]' : ''
      }`}
    >
      {/* Resizer Controls */}
      <div className="pointer-events-auto">
        <NodeResizer
          minWidth={180}
          minHeight={100}
          isVisible={selected}
          lineClassName="!border-[var(--aws-brand)]"
          handleClassName="!w-2.5 !h-2.5 !bg-[var(--aws-brand)] !border-none !rounded-none shadow-xs"
        />
      </div>

      {/* Flush Top-Left Official Group Badge (h-8 px-2.5 flex items-center gap-2) */}
      <div
        style={{
          borderBottomColor: borderColor,
          borderRightColor: borderColor,
          backgroundColor: 'var(--aws-card-bg)',
          color: textColor,
        }}
        className="absolute top-0 left-0 z-10 h-8 px-2.5 flex items-center gap-2 border-b border-r text-[12px] leading-[16px] font-bold font-sans pointer-events-auto cursor-move shadow-xs select-none"
      >
        <AWSServiceIcon groupId={rule.groupId} size={20} variant="group" />
        <span className="truncate">{nodeData.boundaryLabel || rule.label}</span>

        {/* Delete Group Button */}
        <button
          type="button"
          onClick={handleDelete}
          style={{ color: 'var(--aws-text-muted)' }}
          className="ml-1 p-0.5 hover:text-[#DD344C] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
