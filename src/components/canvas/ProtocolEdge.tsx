import React, { memo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react';
import { X, ChevronDown, Check } from 'lucide-react';
import type { EdgeProtocol, CanvasEdgeData } from '../../types/aws';
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
    strokeDasharray: '3 3',
    flowType: 'Control',
  },
  'Event Trigger': {
    stroke: '#E7157B',
    strokeDasharray: '6 4',
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
    markerStart,
    selected,
    animated,
  } = props;

  const edgeData = props.data as unknown as CanvasEdgeData | undefined;
  const updateEdgeProtocol = useCanvasStore((s) => s.updateEdgeProtocol);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const openEdgeInspector = useCanvasStore((s) => s.openEdgeInspector);
  const openContextMenu = useCanvasStore((s) => s.openContextMenu);
  const theme = useCompassStore((s) => s.theme);

  const edgeInStore = useCanvasStore((s) => s.edges.find((e) => e.id === id));
  const protocol = (edgeInStore?.protocol || edgeData?.protocol || 'HTTPS/REST') as EdgeProtocol;
  const isEdgeSelected = useCanvasStore((s) => s.selectedEdgeId === id);

  const activePopoverId = usePopoverStore((s) => s.activePopoverId);
  const openPopover = usePopoverStore((s) => s.openPopover);
  const closePopover = usePopoverStore((s) => s.closePopover);
  const popoverId = `edge-protocol-${id}`;
  const isDropdownOpen = activePopoverId === popoverId;
  const isMounted = useAnimatedOpen(isDropdownOpen, 180);

  const [isHovered, setIsHovered] = useState(false);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });

  // Floating portal positioning anchored to screen coordinates of the badge
  useEffect(() => {
    if (!isDropdownOpen || !badgeRef.current) return;

    const updateMenuCoords = () => {
      if (!badgeRef.current) return;
      const rect = badgeRef.current.getBoundingClientRect();
      const menuWidth = 240;
      const menuHeight = 280;

      let left = rect.left + rect.width / 2 - menuWidth / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

      const overflowBottom = rect.bottom + menuHeight + 10 > window.innerHeight;
      const canFitTop = rect.top - menuHeight > 10;

      if (overflowBottom && canFitTop) {
        setMenuPos({
          bottom: window.innerHeight - rect.top + 6,
          left,
        });
      } else {
        setMenuPos({
          top: rect.bottom + 6,
          left,
        });
      }
    };

    updateMenuCoords();
    window.addEventListener('resize', updateMenuCoords);
    window.addEventListener('scroll', updateMenuCoords, true);
    return () => {
      window.removeEventListener('resize', updateMenuCoords);
      window.removeEventListener('scroll', updateMenuCoords, true);
    };
  }, [isDropdownOpen]);

  // Click outside & Escape dismiss
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        (!badgeRef.current || !badgeRef.current.contains(target))
      ) {
        closePopover(popoverId);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePopover(popoverId);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen, closePopover, popoverId]);

  // Dynamic path routing calculation based on routingStyle (smoothstep / bezier / straight)
  const customOffset = edgeData?.offset;
  const routingOffset = typeof customOffset === 'number' ? customOffset : 28;
  const routing = edgeData?.routingStyle || 'smoothstep';

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (routing === 'bezier') {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else if (routing === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 8,
      offset: routingOffset,
    });
  }

  const protocolStyle = PROTOCOL_STYLES[protocol] || PROTOCOL_STYLES['HTTPS/REST'];

  // Base stroke vs Custom edge color
  const baseStroke = theme === 'dark' ? '#879596' : '#545B64';
  const activeStroke = theme === 'dark' ? '#539FE5' : '#0972D3';
  const customColor = edgeData?.edgeColor;
  const strokeColor = customColor || (selected || isEdgeSelected || isHovered ? activeStroke : baseStroke);

  // Dash array resolution
  const lineStyle = edgeData?.lineStyle;
  const dashArray =
    lineStyle === 'dashed'
      ? '6 4'
      : lineStyle === 'dotted'
        ? '2 3'
        : lineStyle === 'solid'
          ? undefined
          : protocolStyle.strokeDasharray;

  // Directionality markers
  const directionality = edgeData?.directionality || 'one-way';
  const effectiveMarkerEnd = directionality === 'none' ? undefined : markerEnd;
  const effectiveMarkerStart =
    directionality === 'bi-directional' ? markerStart || markerEnd : undefined;

  const isAnimated = edgeData?.animated ?? animated ?? (protocol === 'Event Trigger' || protocol === 'HTTPS/REST');

  const edgeDistance = Math.hypot(targetX - sourceX, targetY - sourceY);
  const isShortSegment = edgeDistance < 90;

  const displayLabel = edgeData?.customLabel || edgeData?.label || protocol;

  const handleProtocolSelect = (newProtocol: EdgeProtocol) => {
    updateEdgeProtocol(id, newProtocol);
    closePopover(popoverId);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeEdge(id);
  };

  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEdgeInspector(id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'edge',
      targetId: id,
    });
  };

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
      className="group"
    >
      <BaseEdge
        path={edgePath}
        markerEnd={effectiveMarkerEnd}
        markerStart={effectiveMarkerStart}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: edgeData?.strokeWidth ? edgeData.strokeWidth : (selected || isEdgeSelected ? 2.5 : 1.75),
          strokeDasharray: isAnimated && !dashArray ? '6 4' : dashArray,
          animation: isAnimated ? 'dash 1.2s linear infinite' : undefined,
          transition: 'stroke 150ms ease-out',
        }}
      />
      {/* Hit-box stroke to make hover / selection easier */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        className="cursor-pointer"
        onClick={handleEdgeClick}
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
              ref={badgeRef}
              type="button"
              onClick={() => (isDropdownOpen ? closePopover(popoverId) : openPopover(popoverId))}
              onDoubleClick={(e) => {
                e.stopPropagation();
                openEdgeInspector(id);
              }}
              onContextMenu={handleContextMenu}
              style={{
                backgroundColor: 'var(--aws-card-bg)',
              }}
              className={`h-6 px-2 rounded-full border text-[11px] font-mono flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${isDropdownOpen || selected || isEdgeSelected
                ? 'border-[var(--aws-interactive)] text-[var(--aws-text-primary)] ring-1 ring-[var(--aws-interactive)]/20'
                : 'border-[var(--aws-border)] hover:border-[var(--aws-interactive)] text-[var(--aws-text-primary)]'
                }`}
              title={`Protocol: ${displayLabel}. Click to switch protocol, double-click to customize line properties.`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: customColor || protocolStyle.stroke }}
              />
              {(!isShortSegment || isHovered || Boolean(edgeData?.customLabel)) && (
                <span className="font-semibold whitespace-nowrap">{displayLabel}</span>
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
        </div>
      </EdgeLabelRenderer>

      {/* Protocol Selection Dropdown Menu - Elevated Portal to document.body (fixed z-[9999]) */}
      {isMounted && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          data-state={isDropdownOpen ? 'open' : 'closed'}
          style={{
            position: 'fixed',
            top: menuPos.top !== undefined ? `${menuPos.top}px` : undefined,
            bottom: menuPos.bottom !== undefined ? `${menuPos.bottom}px` : undefined,
            left: `${menuPos.left}px`,
            zIndex: 9999,
            overscrollBehavior: 'contain',
          }}
          className={`min-w-[240px] rounded-[12px] p-1.5 border bg-[var(--aws-popover-bg)] border-[var(--aws-border)] text-[var(--aws-text-primary)] shadow-[0px_4px_16px_rgba(0,0,0,0.2),0px_16px_36px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_36px_-5px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08)] transition-[opacity,transform] duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${isDropdownOpen
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
            <button
              type="button"
              onClick={() => {
                closePopover(popoverId);
                openEdgeInspector(id);
              }}
              className="text-[10px] text-[var(--aws-interactive)] hover:underline cursor-pointer"
            >
              More options...
            </button>
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
                  className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-[11px] font-mono flex items-center justify-between gap-4 transition-colors duration-100 cursor-pointer ${isCurrent
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
          </div >
        </div >,
        document.body
      )}
    </g >
  );
});

ProtocolEdge.displayName = 'ProtocolEdge';
export default ProtocolEdge;
