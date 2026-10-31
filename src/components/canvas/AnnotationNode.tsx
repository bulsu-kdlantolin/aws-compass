import React, { memo, useState } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import { X, StickyNote, Check } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useCompassStore } from '../../store/useCompassStore';
import type { CanvasNodeData } from '../../types/aws';

interface ColorTheme {
  borderLight: string;
  borderDark: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  titleLight: string;
  titleDark: string;
}

const NOTE_THEMES: Record<string, ColorTheme> = {
  amber: {
    borderLight: '#F59E0B',
    borderDark: '#D97706',
    bgLight: '#FFFBEB',
    bgDark: '#292212',
    textLight: '#78350F',
    textDark: '#FDE68A',
    titleLight: '#92400E',
    titleDark: '#FCD34D',
  },
  blue: {
    borderLight: '#3B82F6',
    borderDark: '#2563EB',
    bgLight: '#EFF6FF',
    bgDark: '#13203C',
    textLight: '#1E40AF',
    textDark: '#BFDBFE',
    titleLight: '#1E3A8A',
    titleDark: '#93C5FD',
  },
  purple: {
    borderLight: '#A855F7',
    borderDark: '#9333EA',
    bgLight: '#FAF5FF',
    bgDark: '#25143A',
    textLight: '#6B21A8',
    textDark: '#E9D5FF',
    titleLight: '#581C87',
    titleDark: '#D8B4FE',
  },
  green: {
    borderLight: '#10B981',
    borderDark: '#059669',
    bgLight: '#F0FDF4',
    bgDark: '#0E291B',
    textLight: '#065F46',
    textDark: '#A7F3D0',
    titleLight: '#064E3B',
    titleDark: '#6EE7B7',
  },
  slate: {
    borderLight: '#94A3B8',
    borderDark: '#64748B',
    bgLight: '#F8FAFC',
    bgDark: '#1E293B',
    textLight: '#334155',
    textDark: '#CBD5E1',
    titleLight: '#0F172A',
    titleDark: '#F1F5F9',
  },
};

export const AnnotationNode = memo((props: NodeProps) => {
  const { id, selected } = props;
  const nodeData = props.data as unknown as CanvasNodeData;

  const removeNode = useCanvasStore((s) => s.removeNode);
  const openNodeInspector = useCanvasStore((s) => s.openNodeInspector);
  const updateNodeProperties = useCanvasStore((s) => s.updateNodeProperties);
  const theme = useCompassStore((s) => s.theme);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(nodeData.annotationTitle || nodeData.label || 'Architecture Note');
  const [editContent, setEditContent] = useState(nodeData.annotationContent || '');

  const colorKey = (nodeData.annotationColor || 'amber').toLowerCase();
  const colorDef = NOTE_THEMES[colorKey] || NOTE_THEMES.amber;

  const borderColor = theme === 'dark' ? colorDef.borderDark : colorDef.borderLight;
  const bgColor = theme === 'dark' ? colorDef.bgDark : colorDef.bgLight;
  const textColor = theme === 'dark' ? colorDef.textDark : colorDef.textLight;
  const titleColor = theme === 'dark' ? colorDef.titleDark : colorDef.titleLight;

  const isTextOnly = Boolean(nodeData.isTextOnly);
  const fontSize = nodeData.fontSize || 18;

  const width = (props.width as number) || nodeData.width || (isTextOnly ? 280 : 220);
  const height = (props.height as number) || nodeData.height || (isTextOnly ? 48 : 140);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(nodeData.annotationTitle || nodeData.label || (isTextOnly ? 'Architecture Section Header' : 'Architecture Note'));
    setEditContent(nodeData.annotationContent || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    updateNodeProperties(id, {
      annotationTitle: editTitle,
      label: editTitle,
      annotationContent: editContent,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      openNodeInspector(id);
    }
  };

  if (isTextOnly) {
    return (
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
        className={`relative flex items-center px-2 py-1 rounded-[4px] group select-none cursor-pointer transition-all ${selected
            ? 'ring-1 ring-[var(--aws-brand)] bg-[var(--aws-brand)]/5'
            : 'hover:bg-[var(--aws-card-bg)]/60'
          }`}
      >
        <NodeResizer
          minWidth={120}
          minHeight={32}
          isVisible={selected}
          lineClassName="!border-[var(--aws-brand)]"
          handleClassName="!w-2 !h-2 !bg-[var(--aws-brand)] !border-none !rounded-none"
        />

        {!isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            style={{ color: 'var(--aws-text-muted)' }}
            className="absolute -top-2 -right-2 p-0.5 rounded-full bg-[var(--aws-card-bg)] border border-[var(--aws-border)] hover:text-[#DD344C] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
            title="Delete text block"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {isEditing ? (
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              onBlur={() => handleSaveEdit()}
              style={{ fontSize: `${fontSize}px` }}
              className="w-full font-bold tracking-tight text-[var(--aws-text-primary)] bg-transparent border-b border-[var(--aws-interactive)] outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveEdit}
              className="text-[#1D8102] hover:opacity-80 p-0.5 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            style={{ fontSize: `${fontSize}px` }}
            className="font-bold tracking-tight text-[var(--aws-text-primary)] truncate w-full select-none"
            title={nodeData.annotationTitle || nodeData.label}
          >
            {nodeData.annotationTitle || nodeData.label || 'Architecture Section Header'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderColor,
        backgroundColor: bgColor,
      }}
      className={`relative rounded-[8px] border shadow-xs transition-shadow group flex flex-col overflow-hidden select-none cursor-pointer ${selected ? 'ring-2 ring-[var(--aws-brand)] shadow-md' : 'hover:shadow-sm'
        }`}
    >
      {/* Node Resizer */}
      <NodeResizer
        minWidth={160}
        minHeight={100}
        isVisible={selected}
        lineClassName="!border-[var(--aws-brand)]"
        handleClassName="!w-2 !h-2 !bg-[var(--aws-brand)] !border-none !rounded-none"
      />

      {/* Delete button on hover */}
      {!isEditing && (
        <button
          type="button"
          onClick={handleDelete}
          style={{ color: 'var(--aws-text-muted)' }}
          className="absolute top-1.5 right-1.5 p-0.5 rounded-full hover:text-[#DD344C] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
          title="Delete note"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Header bar */}
      <div
        style={{ borderBottomColor: borderColor }}
        className="px-2.5 py-1.5 border-b flex items-center gap-1.5 shrink-0"
      >
        <StickyNote className="w-3.5 h-3.5 shrink-0" style={{ color: titleColor }} />
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            placeholder="Note title..."
            className="w-full text-[12px] font-bold bg-transparent outline-none border-b border-current"
            style={{ color: titleColor }}
            autoFocus
          />
        ) : (
          <span
            className="font-bold text-[12px] truncate"
            style={{ color: titleColor }}
            title={nodeData.annotationTitle || nodeData.label}
          >
            {nodeData.annotationTitle || nodeData.label || 'Architecture Note'}
          </span>
        )}
      </div>

      {/* Body Content */}
      <div className="p-2.5 flex-1 overflow-y-auto custom-scrollbar text-[11px] leading-relaxed">
        {isEditing ? (
          <div className="flex flex-col h-full gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write architecture notes, constraints, or decisions..."
              rows={3}
              className="flex-1 w-full text-[11px] bg-transparent outline-none resize-none font-sans"
              style={{ color: textColor }}
            />
            <div className="flex items-center justify-end gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2 py-0.5 text-[10px] rounded border border-current text-[var(--aws-text-muted)] hover:opacity-80 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                style={{ backgroundColor: borderColor, color: '#FFFFFF' }}
                className="px-2 py-0.5 text-[10px] font-semibold rounded flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Save
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: textColor }} className="whitespace-pre-wrap break-words">
            {nodeData.annotationContent || (
              <span className="italic opacity-60">Double-click to edit note...</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
});

AnnotationNode.displayName = 'AnnotationNode';
export default AnnotationNode;

