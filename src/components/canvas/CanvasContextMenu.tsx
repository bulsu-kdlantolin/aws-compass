import React, { useEffect, useRef } from 'react';
import {
  Edit3,
  Copy,
  ArrowUp,
  ArrowDown,
  Trash2,
  ArrowLeftRight,
  Activity,
  BoxSelect,
  StickyNote,
  LayoutGrid,
  Maximize2,
  Users,
} from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useReactFlow } from '@xyflow/react';

export const CanvasContextMenu: React.FC = () => {
  const menuRef = useRef<HTMLDivElement>(null);
  const reactFlow = useReactFlow();

  const contextMenu = useCanvasStore((s) => s.contextMenu);
  const closeContextMenu = useCanvasStore((s) => s.closeContextMenu);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const duplicateNode = useCanvasStore((s) => s.duplicateNode);
  const reorderNodeZ = useCanvasStore((s) => s.reorderNodeZ);
  const reverseEdgeDirection = useCanvasStore((s) => s.reverseEdgeDirection);
  const updateEdgeProperties = useCanvasStore((s) => s.updateEdgeProperties);
  const openNodeInspector = useCanvasStore((s) => s.openNodeInspector);
  const openEdgeInspector = useCanvasStore((s) => s.openEdgeInspector);
  const addAnnotationNode = useCanvasStore((s) => s.addAnnotationNode);
  const addExternalActor = useCanvasStore((s) => s.addExternalActor);
  const addBoundaryNode = useCanvasStore((s) => s.addBoundaryNode);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const edges = useCanvasStore((s) => s.edges);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu, closeContextMenu]);

  if (!contextMenu) return null;

  // Clamping coordinates so menu stays visible on screen
  const menuWidth = 220;
  const menuHeight = contextMenu.type === 'node' ? 200 : contextMenu.type === 'edge' ? 170 : 250;
  const x = Math.min(contextMenu.x, window.innerWidth - menuWidth - 16);
  const y = Math.min(contextMenu.y, window.innerHeight - menuHeight - 16);

  const targetEdge = contextMenu.type === 'edge' ? edges.find((e) => e.id === contextMenu.targetId) : undefined;

  const flowPosition = reactFlow.screenToFlowPosition({
    x: contextMenu.x,
    y: contextMenu.y,
  });

  return (
    <div
      ref={menuRef}
      style={{
        top: `${y}px`,
        left: `${x}px`,
        backgroundColor: 'var(--aws-popover-bg)',
        borderColor: 'var(--aws-border)',
      }}
      className="fixed z-[9999] min-w-[200px] rounded-[10px] border shadow-[0px_4px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] p-1.5 text-[12px] text-[var(--aws-text-primary)] select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Node / Group Context Menu */}
      {contextMenu.type === 'node' && contextMenu.targetId && (
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              if (contextMenu.targetId) openNodeInspector(contextMenu.targetId, 'properties');
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left font-medium"
          >
            <Edit3 className="w-3.5 h-3.5 text-[var(--aws-interactive)]" />
            <span>Edit properties...</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (contextMenu.targetId) duplicateNode(contextMenu.targetId);
              closeContextMenu();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
              <span>Duplicate</span>
            </div>
            <kbd className="font-mono text-[10px] text-[var(--aws-text-muted)] bg-[var(--aws-card-bg)] px-1 rounded border border-[var(--aws-border)]">
              Ctrl+D
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => {
              if (contextMenu.targetId) reorderNodeZ(contextMenu.targetId, 'front');
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
            <span>Bring to front</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (contextMenu.targetId) reorderNodeZ(contextMenu.targetId, 'back');
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left"
          >
            <ArrowDown className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
            <span>Send to back</span>
          </button>
          <div className="my-1 border-t border-[var(--aws-border)]" />
          <button
            type="button"
            onClick={() => {
              if (contextMenu.targetId) removeNode(contextMenu.targetId);
              closeContextMenu();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[#DD344C]/10 text-[#DD344C] cursor-pointer text-left font-medium"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </div>
            <kbd className="font-mono text-[10px] bg-[var(--aws-card-bg)] px-1 rounded border border-[var(--aws-border)] text-[var(--aws-text-muted)]">
              Del
            </kbd>
          </button>
        </div>
      )}

      {/* Edge Context Menu */}
      {contextMenu.type === 'edge' && contextMenu.targetId && (
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              if (contextMenu.targetId) openEdgeInspector(contextMenu.targetId);
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left font-medium"
          >
            <Edit3 className="w-3.5 h-3.5 text-[var(--aws-interactive)]" />
            <span>Edit protocol / properties...</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (contextMenu.targetId) reverseEdgeDirection(contextMenu.targetId);
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
            <span>Reverse direction</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (contextMenu.targetId) {
                const currentAnimated = targetEdge?.data?.animated ?? targetEdge?.animated ?? false;
                updateEdgeProperties(contextMenu.targetId, { animated: !currentAnimated });
              }
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left"
          >
            <Activity className="w-3.5 h-3.5 text-[#1D8102]" />
            <span>Toggle traffic pulse</span>
          </button>
          <div className="my-1 border-t border-[var(--aws-border)]" />
          <button
            type="button"
            onClick={() => {
              if (contextMenu.targetId) removeEdge(contextMenu.targetId);
              closeContextMenu();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[#DD344C]/10 text-[#DD344C] cursor-pointer text-left font-medium"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete connection</span>
            </div>
            <kbd className="font-mono text-[10px] bg-[var(--aws-card-bg)] px-1 rounded border border-[var(--aws-border)] text-[var(--aws-text-muted)]">
              Del
            </kbd>
          </button>
        </div>
      )}

      {/* Canvas Background Context Menu */}
      {contextMenu.type === 'canvas' && (
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-bold text-[var(--aws-text-muted)] border-b border-[var(--aws-border)] mb-0.5 uppercase tracking-wider">
            Add to Canvas
          </div>
          <button
            type="button"
            onClick={() => {
              addAnnotationNode('Architecture Note', '', flowPosition);
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left"
          >
            <StickyNote className="w-3.5 h-3.5 text-[#ED7100]" />
            <span>Add architecture note</span>
          </button>
          <button
            type="button"
            onClick={() => {
              addExternalActor('user-browser', 'User / Client Browser', flowPosition);
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left"
          >
            <Users className="w-3.5 h-3.5 text-[#0972D3]" />
            <span>Add client / actor</span>
          </button>
          <button
            type="button"
            onClick={() => {
              addBoundaryNode('vpc', 'VPC (10.0.0.0/16)', flowPosition);
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left"
          >
            <BoxSelect className="w-3.5 h-3.5 text-[#8C4FFF]" />
            <span>Add VPC boundary</span>
          </button>
          <div className="my-1 border-t border-[var(--aws-border)]" />
          <button
            type="button"
            onClick={() => {
              autoLayout('LR');
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#0972D3]" />
            <span>Auto-Layout (LR)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              reactFlow.fitView({ padding: 0.18, duration: 300 });
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] cursor-pointer text-left"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
            <span>Fit diagram to screen</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CanvasContextMenu;
