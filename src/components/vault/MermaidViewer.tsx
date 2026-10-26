import React, { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { CloudscapeCopyButton } from '../ui/CloudscapeCopyButton';
import { Trace } from '../ui/LoadingIndicators';

interface MermaidViewerProps {
  chart: string;
  className?: string;
}

export const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const theme = useCompassStore((s) => s.theme);

  const handleZoomIn = () => setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))));
  const handleZoomReset = () => setZoom(1);

  useEffect(() => {
    let isCancelled = false;

    const renderChart = async () => {
      if (!chart.trim()) {
        setSvgContent('');
        setError(null);
        return;
      }

      try {
        setError(null);

        // Dynamically initialize Mermaid for active theme with official Cloudscape tokens
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          fontFamily: "'Amazon Ember', 'Open Sans', sans-serif",
          fontSize: 14,
          flowchart: {
            htmlLabels: true,
            curve: 'linear',
            nodeSpacing: 50,
            rankSpacing: 70,
            padding: 8,
          },
          themeVariables:
            theme === 'dark'
              ? {
                  darkMode: true,
                  fontFamily: "'Amazon Ember', 'Open Sans', sans-serif",
                  fontSize: '14px',
                  background: '#0F1B2A',
                  primaryColor: '#161E2D',
                  primaryTextColor: '#EAEDED',
                  primaryBorderColor: '#539FE5',
                  lineColor: '#879596',
                  secondaryColor: '#192534',
                  tertiaryColor: '#161E2D',
                  mainBkg: '#161E2D',
                  nodeBorder: '#539FE5',
                  clusterBkg: '#0F1B2A',
                  clusterBorder: '#354150',
                  titleColor: '#FF9900',
                  edgeLabelBackground: '#0F1B2A',
                  actorBkg: '#161E2D',
                  actorBorder: '#539FE5',
                  actorTextColor: '#EAEDED',
                  signalColor: '#879596',
                  signalTextColor: '#EAEDED',
                }
              : {
                  darkMode: false,
                  fontFamily: "'Amazon Ember', 'Open Sans', sans-serif",
                  fontSize: '14px',
                  background: '#F8F9FA',
                  primaryColor: '#FFFFFF',
                  primaryTextColor: '#16191F',
                  primaryBorderColor: '#0972D3',
                  lineColor: '#545B64',
                  secondaryColor: '#F2F3F3',
                  tertiaryColor: '#FFFFFF',
                  mainBkg: '#FFFFFF',
                  nodeBorder: '#0972D3',
                  clusterBkg: '#F8F9FA',
                  clusterBorder: '#D5DBDB',
                  titleColor: '#EC7211',
                  edgeLabelBackground: '#FFFFFF',
                  actorBkg: '#FFFFFF',
                  actorBorder: '#0972D3',
                  actorTextColor: '#16191F',
                  signalColor: '#545B64',
                  signalTextColor: '#16191F',
                },
          securityLevel: 'loose',
        });

        // Clean any code block wrappers if passed
        const cleanedChart = chart
          .replace(/^```mermaid\s*/i, '')
          .replace(/```$/i, '')
          .trim();

        // Unique element ID for each render pass and theme change
        const renderId = `${diagramId}-${theme}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, cleanedChart);

        if (!isCancelled) {
          setSvgContent(svg);
          setIsRendering(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const message = err instanceof Error ? err.message : 'Invalid Mermaid diagram syntax';
          setError(message);
          setIsRendering(false);
        }
      }
    };

    renderChart();

    return () => {
      isCancelled = true;
    };
  }, [chart, diagramId, theme]);

  return (
    <div
      style={{
        backgroundColor: 'var(--aws-page-bg)',
        borderColor: 'var(--aws-border)',
      }}
      className={`relative rounded-[8px] border my-4 overflow-hidden transition-[background-color,border-color] duration-150 ease-out ${className}`}
    >
      {/* Slim Top Header Bar */}
      <div
        style={{
          borderBottomColor: 'var(--aws-border)',
        }}
        className="px-4 py-2 border-b bg-[#F8F9FA] dark:bg-[#192534] flex items-center justify-between select-none"
      >
        <span
          style={{ color: 'var(--aws-text-primary)' }}
          className="text-[12px] font-semibold"
        >
          Architecture flow
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.6}
            style={{
              backgroundColor: 'var(--aws-card-bg)',
              borderColor: 'var(--aws-border)',
              color: 'var(--aws-text-muted)',
            }}
            className="p-1 rounded-[4px] border hover:text-[var(--aws-text-primary)] hover:border-[var(--aws-brand)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 2.0}
            style={{
              backgroundColor: 'var(--aws-card-bg)',
              borderColor: 'var(--aws-border)',
              color: 'var(--aws-text-muted)',
            }}
            className="p-1 rounded-[4px] border hover:text-[var(--aws-text-primary)] hover:border-[var(--aws-brand)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            style={{
              backgroundColor: 'var(--aws-card-bg)',
              borderColor: 'var(--aws-border)',
              color: 'var(--aws-text-muted)',
            }}
            className="p-1 rounded-[4px] border hover:text-[var(--aws-text-primary)] hover:border-[var(--aws-brand)] cursor-pointer transition-colors"
            title="Fit / Reset zoom (100%)"
            aria-label="Fit / Reset zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div
            style={{ backgroundColor: 'var(--aws-border)' }}
            className="h-3.5 w-px mx-0.5"
          />

          <CloudscapeCopyButton
            textToCopy={chart.trim()}
            label="Copy source"
            copiedLabel="Copied"
            ariaLabel="Copy Mermaid source"
          />
        </div>
      </div>

      {isRendering ? (
        <div
          role="status"
          aria-busy="true"
          aria-live="polite"
          className="flex flex-col items-center justify-center w-full min-h-[180px] p-6 space-y-3 animate-in fade-in duration-150"
        >
          <span className="sr-only">Rendering architecture flow…</span>
          <Trace
            size={22}
            easing="ease-in-out"
            cap="round"
            color={theme === 'dark' ? '#539FE5' : '#0972D3'}
          />
          <span className="text-[12px] font-medium text-[var(--aws-text-muted)] tracking-wide">
            Rendering architecture flow…
          </span>
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 text-[#DD344C] text-[12px] p-4 m-3 rounded-[4px] bg-[#DD344C]/10 border border-[#DD344C]/30">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Mermaid Render Warning</p>
            <p className="font-mono text-[11px] opacity-80 whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6 overflow-x-auto custom-scrollbar min-h-[140px] flex items-center justify-center">
          <div
            ref={containerRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className="mermaid-container flex justify-center items-center w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      )}
    </div>
  );
};

export const MermaidDiagram = MermaidViewer;
export default MermaidViewer;
