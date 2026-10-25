import React, { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Cloud, Shield, Network, Lock, Layers, X } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { CanvasNodeData, GroupBoundaryType } from '../../types/aws';

interface BoundaryStyle {
  border: string;
  bg: string;
  headerBg: string;
  text: string;
  badge: string;
  icon: React.ReactNode;
}

const BOUNDARY_CONFIGS: Record<GroupBoundaryType, BoundaryStyle> = {
  'aws-cloud': {
    border: 'border-slate-700/80 border-dashed',
    bg: 'bg-slate-950/25',
    headerBg: 'bg-slate-900/90 border-slate-700',
    text: 'text-slate-300',
    badge: 'AWS CLOUD',
    icon: <Cloud className="w-3.5 h-3.5 text-sky-400" />,
  },
  vpc: {
    border: 'border-purple-600/40 border-dashed',
    bg: 'bg-purple-950/10',
    headerBg: 'bg-purple-950/80 border-purple-800/80',
    text: 'text-purple-300',
    badge: 'VPC',
    icon: <Network className="w-3.5 h-3.5 text-purple-400" />,
  },
  'public-subnet': {
    border: 'border-sky-500/30 border-solid',
    bg: 'bg-sky-950/10',
    headerBg: 'bg-sky-950/80 border-sky-800/80',
    text: 'text-sky-300',
    badge: 'PUBLIC SUBNET',
    icon: <Shield className="w-3.5 h-3.5 text-sky-400" />,
  },
  'private-subnet': {
    border: 'border-emerald-500/30 border-solid',
    bg: 'bg-emerald-950/10',
    headerBg: 'bg-emerald-950/80 border-emerald-800/80',
    text: 'text-emerald-300',
    badge: 'PRIVATE SUBNET',
    icon: <Lock className="w-3.5 h-3.5 text-emerald-400" />,
  },
  'data-subnet': {
    border: 'border-blue-500/30 border-solid',
    bg: 'bg-blue-950/10',
    headerBg: 'bg-blue-950/80 border-blue-800/80',
    text: 'text-blue-300',
    badge: 'ISOLATED DATA SUBNET',
    icon: <Lock className="w-3.5 h-3.5 text-blue-400" />,
  },
  serverless: {
    border: 'border-pink-500/30 border-dashed',
    bg: 'bg-pink-950/10',
    headerBg: 'bg-pink-950/80 border-pink-800/80',
    text: 'text-pink-300',
    badge: 'MANAGED SERVERLESS',
    icon: <Layers className="w-3.5 h-3.5 text-pink-400" />,
  },
};

export const ArchitectureGroupNode = memo((props: NodeProps) => {
  const { id } = props;
  const nodeData = props.data as unknown as CanvasNodeData;
  const removeNode = useCanvasStore((s) => s.removeNode);

  const boundaryType = (nodeData.boundaryType || 'aws-cloud') as GroupBoundaryType;
  const config = BOUNDARY_CONFIGS[boundaryType] || BOUNDARY_CONFIGS['aws-cloud'];
  const width = nodeData.width || 420;
  const height = nodeData.height || 260;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  return (
    <div
      style={{ width: `${width}px`, height: `${height}px` }}
      className={`relative rounded-xl border-2 transition-all group ${config.border} ${config.bg} select-none`}
    >
      {/* Group Header Badge (Draw.io layout spec) */}
      <div className="absolute -top-3 left-3 z-10 flex items-center gap-1.5 pointer-events-auto">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider shadow-md backdrop-blur-md ${config.headerBg} ${config.text}`}
        >
          {config.icon}
          <span>{nodeData.boundaryLabel || config.badge}</span>
        </div>

        {/* Delete Group Boundary button */}
        <button
          type="button"
          onClick={handleDelete}
          className="p-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
          title="Remove Group Boundary"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Decorative Blueprint Corner Crosses */}
      <div className="absolute top-1 left-1 text-slate-700/60 font-mono text-[9px] pointer-events-none">+</div>
      <div className="absolute top-1 right-1 text-slate-700/60 font-mono text-[9px] pointer-events-none">+</div>
      <div className="absolute bottom-1 left-1 text-slate-700/60 font-mono text-[9px] pointer-events-none">+</div>
      <div className="absolute bottom-1 right-1 text-slate-700/60 font-mono text-[9px] pointer-events-none">+</div>
    </div>
  );
});

ArchitectureGroupNode.displayName = 'ArchitectureGroupNode';
export default ArchitectureGroupNode;
