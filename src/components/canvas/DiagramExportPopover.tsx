import React, { useState } from 'react';
import {
  Download,
  Image as ImageIcon,
  FileCode,
  FileJson,
  Check,
} from 'lucide-react';
import { getNodesBounds } from '@xyflow/react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { CloudscapeCopyButton } from '../ui/CloudscapeCopyButton';

interface DiagramExportPopoverProps {
  reactFlowWrapperRef: React.RefObject<HTMLDivElement | null>;
  markdownSpec: string;
  onClose: () => void;
}

export const DiagramExportPopover: React.FC<DiagramExportPopoverProps> = ({
  reactFlowWrapperRef,
  markdownSpec,
  onClose,
}) => {
  const [scale, setScale] = useState<1 | 2 | 3>(2);
  const [bgMode, setBgMode] = useState<'transparent' | 'theme' | 'white'>('theme');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const theme = useCompassStore((s) => s.theme);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const activeDiagramName = useCanvasStore((s) => s.activeDiagramName);

  const getBackgroundColor = () => {
    if (bgMode === 'transparent') return 'transparent';
    if (bgMode === 'white') return '#FFFFFF';
    return theme === 'dark' ? '#0F1B2A' : '#F2F3F3';
  };

  const handleExportPng = () => {
    setIsExporting(true);
    try {
      const flowEl = reactFlowWrapperRef.current?.querySelector('.react-flow__viewport');
      if (!flowEl) throw new Error('Canvas viewport element not found');

      const bounds = getNodesBounds(nodes);
      const padding = 60;
      const x = bounds.x - padding;
      const y = bounds.y - padding;
      const width = Math.max(400, bounds.width + padding * 2);
      const height = Math.max(300, bounds.height + padding * 2);

      const clone = flowEl.cloneNode(true) as HTMLElement;
      clone.style.transform = `translate(${-x}px, ${-y}px)`;

      const bg = getBackgroundColor();
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <style>
          .react-flow__node { position: absolute; }
          text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        </style>
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; background: ${bg};">
            ${clone.outerHTML}
          </div>
        </foreignObject>
      </svg>`;

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(scale, scale);
          if (bg !== 'transparent') {
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, width, height);
          }
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = pngUrl;
          const cleanName = activeDiagramName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
          a.download = `aws-diagram-${cleanName}-${scale}x-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportSuccess('PNG downloaded');
        setTimeout(() => {
          setExportSuccess(null);
          onClose();
        }, 1000);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };
      img.src = url;
    } catch (err) {
      console.error('Failed to export PNG:', err);
      setIsExporting(false);
    }
  };

  const handleExportSvg = () => {
    setIsExporting(true);
    try {
      const flowEl = reactFlowWrapperRef.current?.querySelector('.react-flow__viewport');
      if (!flowEl) throw new Error('Canvas viewport element not found');

      const bounds = getNodesBounds(nodes);
      const padding = 60;
      const x = bounds.x - padding;
      const y = bounds.y - padding;
      const width = Math.max(400, bounds.width + padding * 2);
      const height = Math.max(300, bounds.height + padding * 2);

      const clone = flowEl.cloneNode(true) as HTMLElement;
      clone.style.transform = `translate(${-x}px, ${-y}px)`;

      const bg = getBackgroundColor();
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <style>
          .react-flow__node { position: absolute; }
          text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        </style>
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; background: ${bg};">
            ${clone.outerHTML}
          </div>
        </foreignObject>
      </svg>`;

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = activeDiagramName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      a.download = `aws-diagram-${cleanName}-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportSuccess('SVG downloaded');
      setTimeout(() => {
        setExportSuccess(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to export SVG:', err);
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            version: '1.0',
            diagramName: activeDiagramName,
            nodes,
            edges,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const cleanName = activeDiagramName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    downloadAnchor.setAttribute('download', `aws-manifest-${cleanName}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportSuccess('JSON exported');
    setTimeout(() => {
      setExportSuccess(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="w-76 p-3 space-y-3 text-[12px] text-[#16191F] dark:text-[#EAEDED] select-none">
      <div className="flex items-center justify-between border-b border-[#EAEDED] dark:border-[#2A3647] pb-2">
        <span className="font-bold text-[13px] flex items-center gap-1.5">
          <Download className="w-4 h-4 text-[#0972D3] dark:text-[#539FE5]" />
          <span>Export Architecture</span>
        </span>
        {exportSuccess && (
          <span className="text-[11px] text-[#1D8102] font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {exportSuccess}
          </span>
        )}
      </div>

      {/* Resolution & Scale Setting */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-[#545B64] dark:text-[#879596]">
          Scale / Resolution
        </label>
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-[6px] bg-[#EAEDED] dark:bg-[#0F141A]">
          {([1, 2, 3] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScale(s)}
              className={`h-6 text-[11px] font-semibold rounded-[4px] transition-colors cursor-pointer ${scale === s
                  ? 'bg-white dark:bg-[#1E2B3D] text-[#0972D3] dark:text-[#539FE5] shadow-xs'
                  : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
                }`}
            >
              {s}x {s === 2 ? '(Retina)' : s === 3 ? '(Print)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Background Options */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-[#545B64] dark:text-[#879596]">
          Canvas Background
        </label>
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-[6px] bg-[#EAEDED] dark:bg-[#0F141A]">
          {[
            { id: 'theme' as const, label: 'Theme' },
            { id: 'white' as const, label: 'White' },
            { id: 'transparent' as const, label: 'Alpha' },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBgMode(b.id)}
              className={`h-6 text-[11px] font-semibold rounded-[4px] transition-colors cursor-pointer ${bgMode === b.id
                  ? 'bg-white dark:bg-[#1E2B3D] text-[#0972D3] dark:text-[#539FE5] shadow-xs'
                  : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
                }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="space-y-1 pt-1 border-t border-[#EAEDED] dark:border-[#2A3647]">
        <button
          type="button"
          onClick={handleExportPng}
          disabled={isExporting}
          className="w-full h-8 px-2.5 rounded-[6px] bg-[#F8F9FA] dark:bg-[#0F141A] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D] border border-[#D5DBDB] dark:border-[#2A3647] flex items-center justify-between font-medium cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5 text-[#539FE5]" />
            <span>High-Res PNG image</span>
          </div>
          <span className="text-[10px] font-mono text-[#545B64] dark:text-[#879596]">
            {scale}x PNG
          </span>
        </button>

        <button
          type="button"
          onClick={handleExportSvg}
          disabled={isExporting}
          className="w-full h-8 px-2.5 rounded-[6px] bg-[#F8F9FA] dark:bg-[#0F141A] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D] border border-[#D5DBDB] dark:border-[#2A3647] flex items-center justify-between font-medium cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-[#FF9900]" />
            <span>Scalable Vector SVG</span>
          </div>
          <span className="text-[10px] font-mono text-[#545B64] dark:text-[#879596]">.svg</span>
        </button>

        <button
          type="button"
          onClick={handleExportJson}
          className="w-full h-8 px-2.5 rounded-[6px] bg-[#F8F9FA] dark:bg-[#0F141A] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D] border border-[#D5DBDB] dark:border-[#2A3647] flex items-center justify-between font-medium cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileJson className="w-3.5 h-3.5 text-[#3F8624]" />
            <span>JSON Architecture Manifest</span>
          </div>
          <span className="text-[10px] font-mono text-[#545B64] dark:text-[#879596]">.json</span>
        </button>
      </div>

      <div className="pt-1 border-t border-[#EAEDED] dark:border-[#2A3647]">
        <CloudscapeCopyButton
          textToCopy={markdownSpec}
          label="Copy Markdown Architecture Spec"
          copiedLabel="Copied Markdown"
          className="w-full justify-between !border-[#D5DBDB] dark:!border-[#2A3647] !bg-[#F8F9FA] dark:!bg-[#0F141A] hover:!bg-[#EAEDED] dark:hover:!bg-[#1E2B3D] !text-[#16191F] dark:!text-[#EAEDED] !text-[12px] !py-1.5 !px-2.5 !rounded-[6px]"
        />
      </div>
    </div>
  );
};

export default DiagramExportPopover;
