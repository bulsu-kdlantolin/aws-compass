import React, { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { X, ChevronDown } from 'lucide-react';
import type { EdgeProtocol } from '../../types/aws';
import { useCanvasStore } from '../../store/useCanvasStore';

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
    strokeDasharray: '3 3', // Dotted Control Flow per Draw.io guidelines
    flowType: 'Control',
  },
  'Event Trigger': {
    stroke: '#E7157B',
    strokeDasharray: '6 4', // Dashed Ingestion Flow per Draw.io guidelines
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
  } = props;

  const updateEdgeProtocol = useCanvasStore((s) => s.updateEdgeProtocol);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const protocol = useCanvasStore(
    (s) => s.edges.find((e) => e.id === id)?.protocol || 'HTTPS/REST'
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 90-degree orthogonal routing per AWS architecture diagram guidelines
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const protocolStyle = PROTOCOL_STYLES[protocol] || PROTOCOL_STYLES['HTTPS/REST'];

  const handleProtocolSelect = (newProtocol: EdgeProtocol) => {
    updateEdgeProtocol(id, newProtocol);
    setIsDropdownOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeEdge(id);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: protocolStyle.stroke,
          strokeWidth: 2,
          strokeDasharray: protocolStyle.strokeDasharray,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan group relative z-10 select-none"
        >
          {/* Protocol Badge with interactive dropdown */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                backgroundColor: 'var(--aws-card-bg)',
                borderColor: protocolStyle.stroke,
                color: 'var(--aws-text-primary)',
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] border text-[11px] font-mono shadow-xs cursor-pointer transition-all hover:scale-105"
              title={`Protocol: ${protocol} (${protocolStyle.flowType} flow). Click to change.`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: protocolStyle.stroke }}
              />
              <span className="font-semibold">{protocol}</span>
              <ChevronDown className="w-3 h-3 text-[var(--aws-text-muted)]" />
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
          {isDropdownOpen && (
            <div
              style={{
                backgroundColor: 'var(--aws-drawer-bg)',
                borderColor: 'var(--aws-border)',
                color: 'var(--aws-text-primary)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              }}
              className="absolute top-6 left-1/2 -translate-x-1/2 w-48 rounded-[4px] border p-1 z-50 animate-in fade-in duration-100"
            >
              <div
                style={{
                  borderColor: 'var(--aws-border)',
                  color: 'var(--aws-text-muted)',
                }}
                className="px-2 py-1 text-[11px] font-mono border-b mb-1 flex items-center justify-between"
              >
                <span>Select protocol</span>
                <span className="text-[10px]">Draw.io</span>
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
                      style={{
                        color: isCurrent ? 'var(--aws-interactive)' : 'var(--aws-text-primary)',
                      }}
                      className={`w-full text-left px-2 py-1 rounded-[4px] text-[11px] font-mono flex items-center justify-between transition-colors cursor-pointer hover:bg-[var(--aws-card-bg)] ${
                        isCurrent ? 'font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: pStyle.stroke }}
                        />
                        <span className="truncate">{p}</span>
                      </div>
                      <span
                        style={{ color: 'var(--aws-text-muted)' }}
                        className="text-[10px] font-sans shrink-0 pl-1"
                      >
                        {pStyle.flowType}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

ProtocolEdge.displayName = 'ProtocolEdge';
export default ProtocolEdge;
