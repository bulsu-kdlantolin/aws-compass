import React, { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { X, ChevronDown, Check } from 'lucide-react';
import type { EdgeProtocol } from '../../types/aws';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useCompassStore } from '../../store/useCompassStore';
import { usePopoverStore } from '../../store/usePopoverStore';
import { useAnimatedOpen } from '../ui/AnimatedPopover';

const PROTOCOLS: EdgeProtocol[] = [
  'HTTPS/REST',
  'IAM Role Assumption',
  'Event Trigger',
  'VPC PrivateLink',
  'SQL/TCP',
  'gRPC',
  'WebSocket',
];

interface ProtocolStyle {
  stroke: string;
  strokeDasharray?: string;
  flowType: 'Query' | 'Control' | 'Ingestion' | 'Stream';
}

const PROTOCOL_STYLES: Record<EdgeProtocol, ProtocolStyle> = {
  'HTTPS/REST': {
    stroke: '#539FE5',
    flowType: 'Query',
  },
  'IAM Role Assumption': {
    stroke: '#8C4FFF',
    strokeDasharray: '3 3', // Dotted Control Flow
    flowType: 'Control',
  },
  'Event Trigger': {
    stroke: '#E7157B',
    strokeDasharray: '6 4', // Dashed Ingestion Flow
    flowType: 'Ingestion',
  },
  'VPC PrivateLink': {
    stroke: '#8C4FFF',
    flowType: 'Query',
  },
  'SQL/TCP': {
    stroke: '#3F8624',
    flowType: 'Query',
  },
  gRPC: {
    stroke: '#ED7100',
    flowType: 'Query',
  },
  WebSocket: {
    stroke: '#539FE5',
    flowType: 'Stream',
  },
};

export const ProtocolEdge = memo((props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
  } = props;

  const updateEdgeProtocol = useCanvasStore((s) => s.updateEdgeProtocol);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const theme = useCompassStore((s) => s.theme);
  const protocol = useCanvasStore(
    (s) => s.edges.find((e) => e.id === id)?.protocol || 'HTTPS/REST'
  );

  const activePopoverId = usePopoverStore((s) => s.activePopoverId);
  const openPopover = usePopoverStore((s) => s.openPopover);
  const closePopover = usePopoverStore((s) => s.closePopover);
  const popoverId = `edge-protocol-${id}`;
  const isDropdownOpen = activePopoverId === popoverId;
  const isMounted = useAnimatedOpen(isDropdownOpen, 180);

  const [isHovered, setIsHovered] = useState(false);

  // Dynamic orthogonal routing offset (supports multi-port fan-out offset separation)
  const customOffset = (props.data as any)?.offset;
  const routingOffset = typeof customOffset === 'number' ? customOffset : 28;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    offset: routingOffset,
  });

  const protocolStyle = PROTOCOL_STYLES[protocol] || PROTOCOL_STYLES['HTTPS/REST'];

  // Base stroke: #545B64 (Light) / #879596 (Dark), transitioning to #0972D3 / #539FE5 when selected or hovered
  const baseStroke = theme === 'dark' ? '#879596' : '#545B64';
  const activeStroke = theme === 'dark' ? '#539FE5' : '#0972D3';
  const strokeColor = selected || isHovered ? activeStroke : baseStroke;

  const edgeDistance = Math.hypot(targetX - sourceX, targetY - sourceY);
  const isShortSegment = edgeDistance < 90;

  const handleProtocolSelect = (newProtocol: EdgeProtocol) => {
    updateEdgeProtocol(id, newProtocol);
    closePopover(popoverId);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeEdge(id);
  };

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: 1.75,
          strokeDasharray: protocolStyle.strokeDasharray,
          transition: 'stroke 150ms ease-out',
        }}
      />
      {/* Invisible wider stroke to make hover / selection easier */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="cursor-pointer"
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 1000,
          }}
          className="nodrag nopan group relative select-none"
        >
          {/* Protocol Badge with opaque canvas-matching pill */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => (isDropdownOpen ? closePopover(popoverId) : openPopover(popoverId))}
              className={`bg-[var(--aws-card-bg)] border px-2 py-0.5 rounded-[4px] text-[11px] font-mono shadow-xs cursor-pointer flex items-center gap-1.5 transition-[border-color,background-color,transform] duration-150 ease-out enabled:active:scale-[0.97] ${
                isDropdownOpen
                  ? 'border-[var(--aws-interactive)] text-[var(--aws-text-primary)]'
                  : 'border-[var(--aws-border)] hover:border-[var(--aws-interactive)] text-[var(--aws-text-primary)]'
              }`}
              title={`Protocol: ${protocol} (${protocolStyle.flowType} flow). Click to change.`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: protocolStyle.stroke }}
              />
              {(!isShortSegment || isHovered) && (
                <span className="font-semibold whitespace-nowrap">{protocol}</span>
              )}
              <ChevronDown
                className="w-3 h-3 text-[var(--aws-text-muted)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Delete Edge Button on Hover */}
            <button
              type="button"
              onClick={handleDelete}
              style={{
                backgroundColor: 'var(--aws-card-bg)',
                borderColor: 'var(--aws-border)',
                color: 'var(--aws-text-muted)',
              }}
              className="p-0.5 rounded-full border hover:text-[#DD344C] hover:border-[#DD344C] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
              title="Delete connection"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Protocol Selection Dropdown Menu */}
          {isMounted && (
            <div
              data-state={isDropdownOpen ? 'open' : 'closed'}
              style={{
                overscrollBehavior: 'contain',
              }}
              className={`absolute top-7 left-1/2 -translate-x-1/2 min-w-[240px] rounded-[12px] p-1.5 border z-[1000] bg-[var(--aws-popover-bg)] border-[var(--aws-border)] text-[var(--aws-text-primary)] shadow-[0px_2px_6px_rgba(0,0,0,0.04),0px_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] transition-[opacity,transform] duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
                isDropdownOpen
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-[0.96] -translate-y-1.5 pointer-events-none'
              }`}
            >
              <div
                style={{
                  borderColor: 'var(--aws-border)',
                  color: 'var(--aws-text-muted)',
                }}
                className="px-2.5 py-1 text-[11px] font-mono border-b mb-1 flex items-center justify-between"
              >
                <span className="font-semibold">Select protocol</span>
              </div>
              <div className="space-y-0.5">
                {PROTOCOLS.map((p) => {
                  const pStyle = PROTOCOL_STYLES[p];
                  const isCurrent = p === protocol;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProtocolSelect(p)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-[11px] font-mono flex items-center justify-between gap-4 transition-colors duration-100 cursor-pointer ${
                        isCurrent
                          ? 'bg-[var(--aws-interactive)]/15 text-[var(--aws-interactive)] font-semibold'
                          : 'text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: pStyle.stroke }}
                        />
                        <span className="truncate">{p}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          style={{ color: 'var(--aws-text-muted)' }}
                          className="text-[10px] font-sans"
                        >
                          {pStyle.flowType}
                        </span>
                        {isCurrent && (
                          <Check className="w-3.5 h-3.5 text-[var(--aws-interactive)]" aria-hidden="true" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </g>
  );
});

ProtocolEdge.displayName = 'ProtocolEdge';
export default ProtocolEdge;
