import React, { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle } from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { CloudscapeCopyButton } from '../ui/CloudscapeCopyButton';
import { CloudscapeSkeleton } from '../ui/CloudscapeSkeleton';

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
  const theme = useCompassStore((s) => s.theme);

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

        // Dynamically initialize Mermaid for active theme
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          themeVariables:
            theme === 'dark'
              ? {
                  darkMode: true,
                  background: '#161E2D',
                  primaryColor: '#192534',
                  primaryTextColor: '#EAEDED',
                  primaryBorderColor: '#539FE5',
                  lineColor: '#539FE5',
                  secondaryColor: '#192534',
                  tertiaryColor: '#0F1B2A',
                  mainBkg: '#161E2D',
                  nodeBorder: '#539FE5',
                  clusterBkg: '#0F1B2A',
                  clusterBorder: '#354150',
                  titleColor: '#FF9900',
                  edgeLabelBackground: '#0F1B2A',
                  actorBkg: '#192534',
                  actorBorder: '#539FE5',
                  actorTextColor: '#EAEDED',
                  signalColor: '#539FE5',
                  signalTextColor: '#EAEDED',
                }
              : {
                  darkMode: false,
                  background: '#FFFFFF',
                  primaryColor: '#F2F3F3',
                  primaryTextColor: '#16191F',
                  primaryBorderColor: '#0972D3',
                  lineColor: '#0972D3',
                  secondaryColor: '#F2F3F3',
                  tertiaryColor: '#FFFFFF',
                  mainBkg: '#FFFFFF',
                  nodeBorder: '#0972D3',
                  clusterBkg: '#F2F3F3',
                  clusterBorder: '#D5DBDB',
                  titleColor: '#EC7211',
                  edgeLabelBackground: '#FFFFFF',
                  actorBkg: '#FFFFFF',
                  actorBorder: '#0972D3',
                  actorTextColor: '#16191F',
                  signalColor: '#0972D3',
                  signalTextColor: '#16191F',
                },
          securityLevel: 'loose',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
      className={`relative group rounded-[6px] border p-4 my-4 overflow-hidden transition-[background-color,border-color] duration-150 ease-out ${className}`}
    >
      {/* Top right utility bar */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity duration-150 z-10">
        <CloudscapeCopyButton
          textToCopy={chart.trim()}
          label="Mermaid"
          copiedLabel="Copied"
          ariaLabel="Copy Mermaid code"
        />
      </div>

      {isRendering ? (
        <div
          role="status"
          aria-busy="true"
          aria-live="polite"
          className="flex flex-col items-center justify-center w-full min-h-[160px] p-6 space-y-3"
        >
          <span className="sr-only">Rendering architecture diagram...</span>
          <div className="flex items-center gap-3 w-full max-w-sm justify-center">
            <CloudscapeSkeleton variant="rect" width="100px" height="38px" className="rounded-[4px]" />
            <CloudscapeSkeleton variant="text" width="50px" height="2px" />
            <CloudscapeSkeleton variant="rect" width="100px" height="38px" className="rounded-[4px]" />
          </div>
          <div className="flex items-center gap-3 w-full max-w-xs justify-center pt-2">
            <CloudscapeSkeleton variant="text" width="130px" height="10px" />
          </div>
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 text-[#DD344C] text-[12px] p-3 rounded-[4px] bg-[#DD344C]/10 border border-[#DD344C]/30">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Mermaid Render Warning</p>
            <p className="font-mono text-[11px] opacity-80 whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="mermaid-container flex justify-center items-center w-full overflow-x-auto min-h-[140px]"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};

export default MermaidViewer;
