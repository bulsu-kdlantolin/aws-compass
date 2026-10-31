import React, { useState, useRef } from 'react';
import {
  ChevronDown,
  Plus,
  GitFork,
  Copy,
  Trash2,
  Edit2,
  Check,
  FolderOpen,
  Sparkles,
  Download,
} from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { usePopoverStore } from '../../store/usePopoverStore';
import { AnimatedPopover } from '../ui/AnimatedPopover';

const REFERENCE_TEMPLATES = [
  {
    id: 'serverless-microservice',
    label: 'Serverless microservice',
    desc: 'Route 53 -> CloudFront -> S3 + API Gateway -> Lambda -> DynamoDB',
  },
  {
    id: '3-tier-vpc',
    label: '3-Tier VPC web app',
    desc: 'IGW -> ALB -> EC2 Auto Scaling -> RDS Multi-AZ',
  },
  {
    id: 'event-driven-pipeline',
    label: 'Event-driven pipeline',
    desc: 'S3 Event -> SNS -> SQS -> Lambda Worker',
  },
  {
    id: 'containerized-fargate',
    label: 'Containerized Fargate service',
    desc: 'ALB -> ECS Fargate -> Amazon ECR + CloudWatch',
  },
];

export const BlueprintManagerDropdown: React.FC = () => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activePopoverId = usePopoverStore((s) => s.activePopoverId);
  const togglePopover = usePopoverStore((s) => s.togglePopover);
  const closePopover = usePopoverStore((s) => s.closePopover);

  const popoverId = 'canvas-blueprint-dropdown';
  const isOpen = activePopoverId === popoverId;

  const activeDiagramId = useCanvasStore((s) => s.activeDiagramId);
  const activeDiagramName = useCanvasStore((s) => s.activeDiagramName);
  const savedDiagrams = useCanvasStore((s) => s.savedDiagrams);
  const loadTemplate = useCanvasStore((s) => s.loadTemplate);
  const loadSnapshot = useCanvasStore((s) => s.loadSnapshot);
  const createBlankBlueprint = useCanvasStore((s) => s.createBlankBlueprint);
  const duplicateBlueprint = useCanvasStore((s) => s.duplicateBlueprint);
  const deleteBlueprint = useCanvasStore((s) => s.deleteBlueprint);
  const renameBlueprint = useCanvasStore((s) => s.renameBlueprint);
  const exportBlueprintJson = useCanvasStore((s) => s.exportBlueprintJson);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const handleStartRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameDraft(currentName);
  };

  const handleCommitRename = async (id: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (renameDraft.trim()) {
      await renameBlueprint(id, renameDraft.trim());
    }
    setRenamingId(null);
  };

  const handleSelectReference = (templateId: string) => {
    loadTemplate(templateId);
    closePopover(popoverId);
  };

  const handleSelectCustom = (diagramId: string) => {
    loadSnapshot(diagramId);
    closePopover(popoverId);
  };

  const handleNewBlank = () => {
    createBlankBlueprint();
    closePopover(popoverId);
  };

  const handleFork = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateBlueprint(id);
    closePopover(popoverId);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this custom blueprint?')) {
      await deleteBlueprint(id);
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => togglePopover(popoverId)}
        aria-expanded={isOpen}
        data-open={isOpen ? 'true' : 'false'}
        className={`h-8 px-3 rounded-[6px] border text-[12px] font-medium flex items-center justify-between gap-2 enabled:active:scale-[0.98] transition-[background-color,border-color,color] duration-150 cursor-pointer bg-[var(--aws-card-bg)] text-[var(--aws-text-primary)] min-w-[210px] max-w-[260px] shadow-xs border-[#D5DBDB] dark:border-[#354150] hover:bg-[#F8F9FA] dark:hover:bg-[#192534] ${isOpen ? 'ring-1 ring-[#D5DBDB] dark:ring-[#354150]' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <Sparkles className="w-3.5 h-3.5 text-[#FF9900] shrink-0" />
          <span className="truncate font-semibold">{activeDiagramName}</span>
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 text-[var(--aws-text-muted)] shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatedPopover
        isOpen={isOpen}
        onClose={() => {
          setRenamingId(null);
          closePopover(popoverId);
        }}
        triggerRef={triggerRef}
        align="left"
        className="w-[320px] p-1.5 space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar"
      >
        {/* Section 1: Quick Action -> New Blank Blueprint */}
        <div className="border-b border-[var(--aws-border)] pb-1.5">
          <button
            type="button"
            onClick={handleNewBlank}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[12px] font-semibold text-[var(--aws-interactive)] hover:bg-[var(--aws-interactive)]/10 transition-colors cursor-pointer text-left"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ New blank sandbox blueprint</span>
          </button>
        </div>

        {/* Section 2: Custom Blueprints */}
        <div>
          <div className="px-2.5 py-1 text-[11px] font-bold text-[var(--aws-text-muted)] flex items-center justify-between">
            <span>Custom blueprints</span>
            <span className="font-mono text-[10px]">{savedDiagrams.length}</span>
          </div>

          {savedDiagrams.length === 0 ? (
            <div className="px-2.5 py-2 text-[11px] text-[var(--aws-text-muted)] italic">
              No custom blueprints yet. Fork or save one to personalize.
            </div>
          ) : (
            <div className="space-y-0.5">
              {savedDiagrams.map((diag) => {
                const isActive = activeDiagramId === diag.id;
                const isRenaming = renamingId === diag.id;

                return (
                  <div
                    key={diag.id}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] transition-colors ${isActive
                        ? 'bg-[#F2F3F3] dark:bg-[#1F2B3E] text-[#16191F] dark:text-[#EAEDED] font-semibold border-l-[2.5px] border-l-[#FF9900]'
                        : 'text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)] border-l-[2.5px] border-l-transparent'
                      }`}
                  >
                    {isRenaming ? (
                      <div className="flex items-center gap-1.5 flex-1 pr-1">
                        <input
                          type="text"
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitRename(diag.id);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          autoFocus
                          className="flex-1 h-6 px-1.5 text-[11px] rounded border border-[var(--aws-interactive)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCommitRename(diag.id)}
                          className="p-1 text-[#1D8102] hover:opacity-80 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSelectCustom(diag.id)}
                          className="flex items-center gap-2.5 truncate text-left flex-1 cursor-pointer"
                        >
                          {diag.thumbnail ? (
                            <div className="w-10 h-6.5 rounded border border-[#D5DBDB] dark:border-[#2A3647] overflow-hidden shrink-0 bg-[#F8F9FA] dark:bg-[#0F141A]">
                              <img
                                src={diag.thumbnail}
                                alt={diag.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <FolderOpen className="w-3.5 h-3.5 text-[#1D8102] shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="truncate font-medium">{diag.name}</div>
                            <div className="text-[10px] text-[var(--aws-text-muted)] font-mono">
                              {diag.nodes?.length || 0} nodes
                            </div>
                          </div>
                        </button>

                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-[#FF9900] shrink-0 ml-1.5" />
                          )}

                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportBlueprintJson(diag.id);
                              }}
                              className="p-1 text-[var(--aws-text-muted)] hover:text-[#0972D3] dark:hover:text-[#539FE5] cursor-pointer"
                              title="Export Blueprint to JSON"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(diag.id, diag.name, e)}
                              className="p-1 text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] cursor-pointer"
                              title="Rename blueprint"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleFork(diag.id, e)}
                              className="p-1 text-[var(--aws-text-muted)] hover:text-[var(--aws-interactive)] cursor-pointer"
                              title="Duplicate blueprint"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(diag.id, e)}
                              className="p-1 text-[var(--aws-text-muted)] hover:text-[#DD344C] cursor-pointer"
                              title="Delete blueprint"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                    )}
                      </div>
                    );
              })}
                  </div>
                )
              }
        </div>

          {/* Section 3: Built-in Blueprints */}
          <div className="border-t border-[var(--aws-border)] pt-1.5">
            <div className="px-2.5 py-1 text-[11px] font-bold text-[var(--aws-text-muted)] flex items-center justify-between">
              <span>Built-in blueprints</span>
              <span className="font-mono text-[10px]">4 Templates</span>
            </div>

            <div className="space-y-0.5">
              {REFERENCE_TEMPLATES.map((tpl) => {
                const isActive = activeDiagramId === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] transition-colors ${isActive
                        ? 'bg-[#F2F3F3] dark:bg-[#1F2B3E] text-[#16191F] dark:text-[#EAEDED] font-semibold border-l-[2.5px] border-l-[#FF9900]'
                        : 'text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)] border-l-[2.5px] border-l-transparent'
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectReference(tpl.id)}
                      className="truncate text-left flex-1 cursor-pointer"
                      title={tpl.desc}
                    >
                      <div className="truncate font-medium">{tpl.label}</div>
                      <div className="text-[10px] text-[var(--aws-text-muted)] truncate opacity-80">
                        {tpl.desc}
                      </div>
                    </button>

                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-[#FF9900] shrink-0 ml-1.5" />
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleFork(tpl.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 px-1.5 py-0.5 text-[10px] rounded border border-[var(--aws-border)] hover:border-[var(--aws-interactive)] hover:text-[var(--aws-interactive)] bg-[var(--aws-page-bg)] flex items-center gap-1 cursor-pointer shrink-0"
                      title="Fork reference template to a custom blueprint"
                    >
                      <GitFork className="w-3 h-3" />
                      <span>Fork</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
      </AnimatedPopover>
    </div>
  );
};

export default BlueprintManagerDropdown;

