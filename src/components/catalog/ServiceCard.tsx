import React from 'react';
import type { AWSService } from '../../types/aws';
import { GripVertical, Star } from 'lucide-react';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { useCompassStore } from '../../store/useCompassStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface ServiceCardProps {
  service: AWSService;
  isSelected: boolean;
  onSelect: () => void;
  isDragging?: boolean;
  dropPosition?: 'top' | 'bottom' | null;
  onDragStart?: (e: React.DragEvent, service: AWSService) => void;
  onDragOver?: (e: React.DragEvent, service: AWSService) => void;
  onDragLeave?: (e: React.DragEvent, service: AWSService) => void;
  onDrop?: (e: React.DragEvent, service: AWSService) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected,
  onSelect,
  isDragging = false,
  dropPosition = null,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
}) => {
  const uiDensity = useSettingsStore((s) => s.uiDensity);
  const isCompact = uiDensity === 'compact';
  const toggleFavorite = useCompassStore((s) => s.toggleFavorite);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/aws-service-id', service.id);
    e.dataTransfer.setData('application/aws-service-category', service.category);
    e.dataTransfer.setData('text/plain', service.id);
    e.dataTransfer.effectAllowed = 'copyMove';

    if (onDragStart) {
      onDragStart(e, service);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    } else if (e.altKey && e.key === 'ArrowUp' && onMoveUp) {
      e.preventDefault();
      onMoveUp();
    } else if (e.altKey && e.key === 'ArrowDown' && onMoveDown) {
      e.preventDefault();
      onMoveDown();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => onDragOver?.(e, service)}
      onDragLeave={(e) => onDragLeave?.(e, service)}
      onDrop={(e) => onDrop?.(e, service)}
      onDragEnd={onDragEnd}
      aria-grabbed={isDragging ? 'true' : 'false'}
      style={{
        backgroundColor: isSelected ? 'var(--aws-page-bg)' : 'transparent',
        borderLeftColor: isSelected ? 'var(--aws-brand)' : 'transparent',
      }}
      className={`group relative flex items-center cursor-pointer border-l-2 text-left select-none transition-[opacity,background-color,border-color,transform] duration-100 ${isCompact ? 'h-6.5 px-1.5 gap-1.5 text-[12px]' : 'h-7.5 px-2 gap-2 text-[13px]'
        } ${isDragging
          ? 'opacity-35 scale-[0.98] ring-1 ring-[var(--aws-interactive)]/40 bg-[var(--aws-page-bg)]'
          : isSelected
            ? 'text-[var(--aws-text-primary)] font-semibold'
            : 'text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] hover:text-[var(--aws-text-primary)]'
        }`}
      title={`${service.name} (Drag to rearrange or add to canvas, Alt+Up/Down to reorder)`}
    >
      {/* Drop Indicator - Top (Drop Before) */}
      {dropPosition === 'top' && (
        <div className="absolute -top-[1px] left-0 right-0 h-[2px] bg-[#FF9900] z-30 pointer-events-none flex items-center shadow-[0_0_8px_rgba(255,153,0,0.8)]">
          <div className="w-2 h-2 rounded-full bg-[#FF9900] -ml-1 border-2 border-[var(--aws-page-bg)]" />
        </div>
      )}

      {/* Drop Indicator - Bottom (Drop After) */}
      {dropPosition === 'bottom' && (
        <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[#FF9900] z-30 pointer-events-none flex items-center shadow-[0_0_8px_rgba(255,153,0,0.8)]">
          <div className="w-2 h-2 rounded-full bg-[#FF9900] -ml-1 border-2 border-[var(--aws-page-bg)]" />
        </div>
      )}

      {/* Drag handle */}
      <span
        className="opacity-40 group-hover:opacity-100 text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] cursor-grab active:cursor-grabbing shrink-0 transition-opacity"
        title="Drag to rearrange within or across categories, or drag to canvas"
      >
        <GripVertical className="w-3 h-3" strokeWidth={1.75} />
      </span>

      {/* Official AWS Architecture Icon tile */}
      <AWSServiceIcon serviceId={service.id} size={isCompact ? 18 : 20} className="shrink-0" />

      {/* Service Name (Sentence case, truncate) */}
      <span className={`${isCompact ? 'text-[12px] leading-[16px]' : 'text-[13px] leading-[18px]'} truncate flex-1 min-w-0`}>
        {service.name}
      </span>

      {/* Tier (11px monospace) */}
      <span className="text-[11px] font-mono text-[var(--aws-text-muted)] shrink-0 opacity-75">
        T{service.tier}
      </span>

      {/* 14px Star Favorite Action Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(service.id);
        }}
        className={`shrink-0 p-0.5 rounded transition-all cursor-pointer ${service.isFavorite
            ? 'opacity-100 text-[#FF9900]'
            : 'opacity-0 group-hover:opacity-100 text-[var(--aws-text-muted)] hover:text-[#FF9900]'
          }`}
        title={service.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-label={service.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star
          className={`w-3.5 h-3.5 transition-transform active:scale-90 ${service.isFavorite ? 'fill-[#FF9900] text-[#FF9900]' : ''
            }`}
        />
      </button>
    </div>
  );
};

export default ServiceCard;
