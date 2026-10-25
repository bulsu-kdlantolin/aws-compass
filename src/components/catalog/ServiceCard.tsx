import React from 'react';
import type { AWSService } from '../../types/aws';
import { GripVertical } from 'lucide-react';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeStatusIndicator } from '../ui/CloudscapeStatusIndicator';

interface ServiceCardProps {
  service: AWSService;
  isSelected: boolean;
  onSelect: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, isSelected, onSelect }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/aws-service-id', service.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      draggable
      onDragStart={handleDragStart}
      style={{
        backgroundColor: isSelected ? 'var(--aws-card-bg)' : 'transparent',
        borderLeftColor: isSelected ? 'var(--aws-brand)' : 'transparent',
      }}
      className={`group h-7 px-2 flex items-center gap-1.5 cursor-pointer border-l-2 text-left select-none transition-colors duration-100 ${
        isSelected
          ? 'text-[var(--aws-text-primary)] font-semibold'
          : 'text-[var(--aws-text-primary)] hover:bg-[var(--aws-card-bg)] hover:text-[var(--aws-text-primary)]'
      }`}
      title={`${service.name} (Drag to add to canvas, click to inspect)`}
    >
      {/* Drag handle */}
      <span className="opacity-0 group-hover:opacity-70 text-[var(--aws-text-muted)] cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical className="w-3 h-3" strokeWidth={1.75} />
      </span>

      {/* Official 20x20px AWS Architecture Icon tile */}
      <AWSServiceIcon serviceId={service.id} size={20} className="shrink-0" />

      {/* Service Name (13px, Sentence case, truncate) */}
      <span className="text-[13px] leading-[18px] truncate flex-1 min-w-0">
        {service.name}
      </span>

      {/* Tier (11px monospace) */}
      <span className="text-[11px] font-mono text-[var(--aws-text-muted)] shrink-0 opacity-75">
        T{service.tier}
      </span>

      {/* Bare status indicator (14px icon) */}
      <div className="shrink-0">
        <CloudscapeStatusIndicator status={service.studyStatus} showLabel={false} />
      </div>
    </div>
  );
};

export default ServiceCard;
