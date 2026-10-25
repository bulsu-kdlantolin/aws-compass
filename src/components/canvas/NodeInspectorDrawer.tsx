import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Markdown from 'react-markdown';
import {
  ExternalLink,
  BookOpen,
  Check,
  Copy,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Trash2,
  CopyPlus,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { MermaidViewer } from '../vault/MermaidViewer';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeSplitPanel } from '../ui/CloudscapeSplitPanel';
import { CloudscapeTabs } from '../ui/CloudscapeTabs';
import { CloudscapeStatusIndicator } from '../ui/CloudscapeStatusIndicator';
import { CloudscapeCodeBlock } from '../ui/CloudscapeCodeBlock';

const NodeNotesEditor: React.FC<{
  initialNotes: string;
  onSave: (notes: string) => void;
}> = ({ initialNotes, onSave }) => {
  const [notes, setNotes] = useState(initialNotes);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    onSave(val);
  };

  return (
    <textarea
      value={notes}
      onChange={handleChange}
      rows={3}
      placeholder="Specify the specific purpose of this instance in your architecture (e.g. Ingress proxy, Redis cluster, payment queue)..."
      style={{
        backgroundColor: 'var(--aws-page-bg)',
        borderColor: 'var(--aws-input-border)',
        color: 'var(--aws-text-primary)',
      }}
      className="w-full border rounded-[4px] p-2.5 text-[12px] leading-[16px] focus:border-[var(--aws-interactive)] outline-none resize-none"
    />
  );
};

export const NodeInspectorDrawer: React.FC = () => {
  const reactFlow = useReactFlow();

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const isInspectorOpen = useCanvasStore((s) => s.isInspectorOpen);
  const closeInspector = useCanvasStore((s) => s.closeInspector);
  const openInspector = useCanvasStore((s) => s.openInspector);
  const updateNodeNotes = useCanvasStore((s) => s.updateNodeNotes);
  const updateNodeStatus = useCanvasStore((s) => s.updateNodeStatus);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const addServiceNode = useCanvasStore((s) => s.addServiceNode);

  const services = useCompassStore((s) => s.services);
  const updateServiceStatus = useCompassStore((s) => s.updateServiceStatus);
  const setWorkspaceMode = useCompassStore((s) => s.setWorkspaceMode);
  const setSelectedServiceId = useCompassStore((s) => s.setSelectedServiceId);

  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'details' | 'dossier'>('details');
  const [copiedArn, setCopiedArn] = useState(false);

  const currentNode = nodes.find((n) => n.id === selectedNodeId);
  const service = services.find((s) => s.id === currentNode?.data.serviceId);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInspectorOpen) {
        closeInspector();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectorOpen, closeInspector]);

  const handleCopyArn = async () => {
    if (service?.arnExample) {
      await navigator.clipboard.writeText(service.arnExample);
      setCopiedArn(true);
      setTimeout(() => setCopiedArn(false), 2000);
    }
  };

  const handleOpenFullVault = () => {
    if (service) {
      setSelectedServiceId(service.id);
      setWorkspaceMode('vault');
    }
  };

  const handleFocusNode = useCallback(() => {
    if (!currentNode) return;
    reactFlow.setCenter(currentNode.position.x + 50, currentNode.position.y + 30, {
      zoom: 1.2,
      duration: 500,
    });
  }, [currentNode, reactFlow]);

  const handleCloneNode = useCallback(() => {
    if (!service || !currentNode) return;
    const offset = 40;
    addServiceNode(service, {
      x: currentNode.position.x + offset,
      y: currentNode.position.y + offset,
    });
  }, [service, currentNode, addServiceNode]);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    removeNode(selectedNodeId);
  }, [selectedNodeId, removeNode]);

  if (!isInspectorOpen || !selectedNodeId || !currentNode) {
    return null;
  }

  const incomingEdges = edges.filter((e) => e.target === selectedNodeId);
  const outgoingEdges = edges.filter((e) => e.source === selectedNodeId);

  const headerTitle = (
    <div className="flex items-center gap-2.5 truncate">
      <AWSServiceIcon serviceId={currentNode.data.serviceId} size={24} variant="service" />
      <div className="truncate">
        <div className="text-[14px] leading-[20px] font-bold text-[var(--aws-text-primary)] truncate">
          {currentNode.data.label}
        </div>
        <div className="text-[12px] leading-[16px] text-[var(--aws-text-muted)] font-mono truncate">
          {currentNode.data.serviceId} • Tier {currentNode.data.tier} • {currentNode.data.category}
        </div>
      </div>
    </div>
  );

  const headerActions = (
    <button
      type="button"
      onClick={handleFocusNode}
      style={{ color: 'var(--aws-text-muted)' }}
      className="p-1 rounded-[4px] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] transition-colors cursor-pointer"
      title="Center canvas on this node"
    >
      <Maximize2 className="w-4 h-4" />
    </button>
  );

  return (
    <CloudscapeSplitPanel
      isOpen={isInspectorOpen}
      onClose={closeInspector}
      title={headerTitle}
      headerActions={headerActions}
      defaultPosition="side"
      initialWidth={440}
    >
      {/* Flush Underline Tabs */}
      <CloudscapeTabs
        tabs={[
          { id: 'details', label: 'Node details' },
          { id: 'dossier', label: '6-Part dossier', icon: <BookOpen className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={(tab) => {
          startTransition(() => {
            setActiveTab(tab as 'details' | 'dossier');
          });
        }}
      />

      {/* Panel Body */}
      <div className="p-4 space-y-4">
        {activeTab === 'details' ? (
          <div className="space-y-4 text-[14px]">
            {/* Custom Notes / Architecture Role */}
            <div
              style={{
                backgroundColor: 'var(--aws-card-bg)',
                borderColor: 'var(--aws-border)',
              }}
              className="p-4 rounded-[8px] border space-y-2"
            >
              <div className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                Architecture role &amp; instance notes
              </div>
              <NodeNotesEditor
                key={currentNode.id}
                initialNotes={currentNode.data.customNotes || ''}
                onSave={(val) => updateNodeNotes(currentNode.id, val)}
              />
            </div>

            {/* Study Status */}
            <div
              style={{
                backgroundColor: 'var(--aws-card-bg)',
                borderColor: 'var(--aws-border)',
              }}
              className="p-4 rounded-[8px] border space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                  Study mastery status
                </span>
                <CloudscapeStatusIndicator status={currentNode.data.status} />
              </div>

              {/* Status Selector Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {(['not-started', 'in-progress', 'mastered', 'review'] as const).map((st) => {
                  const isActive = currentNode.data.status === st;
                  const labels = {
                    'not-started': 'Not started',
                    'in-progress': 'In progress',
                    mastered: 'Mastered',
                    review: 'Review needed',
                  };
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={async () => {
                        await updateServiceStatus(currentNode.data.serviceId, st);
                        updateNodeStatus(currentNode.data.serviceId, st);
                      }}
                      style={
                        isActive
                          ? {
                              backgroundColor: 'var(--aws-interactive)',
                              borderColor: 'var(--aws-interactive)',
                              color: '#FFFFFF',
                            }
                          : {
                              backgroundColor: 'var(--aws-page-bg)',
                              borderColor: 'var(--aws-border)',
                              color: 'var(--aws-text-primary)',
                            }
                      }
                      className="px-2 py-1.5 rounded-[4px] border text-[11px] font-medium transition-colors cursor-pointer text-center truncate"
                    >
                      {labels[st]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ARN Pattern */}
            {service?.arnExample && (
              <div
                style={{
                  backgroundColor: 'var(--aws-card-bg)',
                  borderColor: 'var(--aws-border)',
                }}
                className="p-4 rounded-[8px] border space-y-2"
              >
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-bold text-[var(--aws-text-primary)]">
                    ARN specification pattern
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyArn}
                    style={{ color: 'var(--aws-interactive)' }}
                    className="flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedArn ? <Check className="w-3.5 h-3.5 text-[#1D8102]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedArn ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div
                  style={{
                    backgroundColor: '#0F141A',
                    borderColor: 'var(--aws-border)',
                    color: '#EAEDED',
                  }}
                  className="font-mono text-[11px] p-2.5 rounded-[4px] border break-all select-all"
                >
                  {service.arnExample}
                </div>
              </div>
            )}

            {/* Live Canvas Connections */}
            <div
              style={{
                backgroundColor: 'var(--aws-card-bg)',
                borderColor: 'var(--aws-border)',
              }}
              className="p-4 rounded-[8px] border space-y-3"
            >
              <div className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                Active canvas connections
              </div>

              {/* Incoming */}
              <div>
                <div className="text-[11px] text-[var(--aws-text-muted)] flex items-center gap-1.5 mb-1.5 font-semibold">
                  <ArrowLeft className="w-3.5 h-3.5 text-[var(--aws-interactive)]" />
                  <span>Incoming connections ({incomingEdges.length})</span>
                </div>
                {incomingEdges.length === 0 ? (
                  <div className="text-[12px] text-[var(--aws-text-muted)] pl-5 italic">
                    No incoming connections
                  </div>
                ) : (
                  <div className="space-y-1.5 pl-2">
                    {incomingEdges.map((e) => {
                      const sourceNode = nodes.find((n) => n.id === e.source);
                      return (
                        <div
                          key={e.id}
                          style={{
                            backgroundColor: 'var(--aws-page-bg)',
                            borderColor: 'var(--aws-border)',
                          }}
                          className="flex items-center justify-between p-2 rounded-[4px] border text-[12px] group"
                        >
                          <button
                            type="button"
                            onClick={() => openInspector(e.source)}
                            className="text-left font-medium text-[var(--aws-text-primary)] hover:text-[var(--aws-interactive)] flex items-center gap-2 cursor-pointer truncate"
                            title="Inspect source node"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--aws-interactive)] shrink-0" />
                            <span className="truncate">{sourceNode?.data.label || e.source}</span>
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-[var(--aws-border)] text-[var(--aws-text-muted)]">
                              {e.protocol}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeEdge(e.id)}
                              className="text-[var(--aws-text-muted)] hover:text-[#DD344C] opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Disconnect"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Outgoing */}
              <div>
                <div className="text-[11px] text-[var(--aws-text-muted)] flex items-center gap-1.5 mb-1.5 font-semibold">
                  <ArrowRight className="w-3.5 h-3.5 text-[#3F8624]" />
                  <span>Outgoing connections ({outgoingEdges.length})</span>
                </div>
                {outgoingEdges.length === 0 ? (
                  <div className="text-[12px] text-[var(--aws-text-muted)] pl-5 italic">
                    No outgoing connections
                  </div>
                ) : (
                  <div className="space-y-1.5 pl-2">
                    {outgoingEdges.map((e) => {
                      const targetNode = nodes.find((n) => n.id === e.target);
                      return (
                        <div
                          key={e.id}
                          style={{
                            backgroundColor: 'var(--aws-page-bg)',
                            borderColor: 'var(--aws-border)',
                          }}
                          className="flex items-center justify-between p-2 rounded-[4px] border text-[12px] group"
                        >
                          <button
                            type="button"
                            onClick={() => openInspector(e.target)}
                            className="text-left font-medium text-[var(--aws-text-primary)] hover:text-[var(--aws-interactive)] flex items-center gap-2 cursor-pointer truncate"
                            title="Inspect target node"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3F8624] shrink-0" />
                            <span className="truncate">{targetNode?.data.label || e.target}</span>
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-[var(--aws-border)] text-[var(--aws-text-muted)]">
                              {e.protocol}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeEdge(e.id)}
                              className="text-[var(--aws-text-muted)] hover:text-[#DD344C] opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Disconnect"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCloneNode}
                style={{
                  backgroundColor: 'var(--aws-card-bg)',
                  borderColor: 'var(--aws-border)',
                  color: 'var(--aws-text-primary)',
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[13px] font-medium hover:border-[var(--aws-interactive)] transition-colors cursor-pointer"
              >
                <CopyPlus className="w-4 h-4 text-[var(--aws-interactive)]" />
                <span>Clone node</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteNode}
                style={{
                  backgroundColor: 'var(--aws-card-bg)',
                  borderColor: 'var(--aws-border)',
                  color: 'var(--aws-text-muted)',
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[13px] font-medium hover:text-[#DD344C] hover:border-[#DD344C] transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete node</span>
              </button>
            </div>

            {/* Jump to Full Vault Primary CTA */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleOpenFullVault}
                style={{
                  backgroundColor: '#FF9900',
                  color: '#0F141A',
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] font-bold text-[14px] hover:bg-[#EC7211] transition-colors shadow-xs cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open in Concept Vault dossier</span>
              </button>

              {service?.docsUrl && (
                <a
                  href={service.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                    color: 'var(--aws-text-primary)',
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[12px] hover:border-[var(--aws-interactive)] transition-colors"
                >
                  <span>Official AWS reference documentation</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
                </a>
              )}
            </div>
          </div>
        ) : (
          /* Dossier Tab View */
          <div className="vault-prose space-y-4">
            {service ? (
              <Markdown
                components={{
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    if (language === 'mermaid') {
                      return <MermaidViewer chart={String(children).replace(/\n$/, '')} />;
                    }
                    if (language === 'bash' || language === 'sh' || language === 'cli') {
                      return (
                        <CloudscapeCodeBlock
                          code={String(children).replace(/\n$/, '')}
                          language="bash"
                          title="aws-cli"
                        />
                      );
                    }
                    return (
                      <code className={className} {...rest}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {service.markdownDoc}
              </Markdown>
            ) : (
              <div className="text-[var(--aws-text-muted)] text-center py-8">
                <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>No dossier available for this service.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </CloudscapeSplitPanel>
  );
};

export default NodeInspectorDrawer;
