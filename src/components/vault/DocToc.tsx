import React, { useEffect, useState } from 'react';
import { AlignLeft, ChevronRight } from 'lucide-react';

export interface TocItem {
  id: string;
  label: string;
  number?: string;
}

export interface DocTocProps {
  items: TocItem[];
  containerRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export const DocToc: React.FC<DocTocProps> = ({
  items,
  containerRef,
  className = '',
}) => {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || '');

  useEffect(() => {
    const scrollContainer = containerRef?.current || window;

    const handleScroll = () => {
      // Find which section is currently near top of viewport
      const threshold = 180;
      let currentActive = items[0]?.id;

      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            currentActive = item.id;
          }
        }
      }

      if (currentActive) {
        setActiveId(currentActive);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [items, containerRef]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (containerRef?.current) {
      const container = containerRef.current;
      const elTop = el.offsetTop - 24;
      container.scrollTo({
        top: elTop,
        behavior: 'smooth',
      });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveId(id);
  };

  return (
    <nav
      aria-label="Table of contents"
      className={`w-60 shrink-0 select-none hidden xl:block sticky top-6 ${className}`}
    >
      <div
        style={{
          backgroundColor: 'var(--aws-card-bg)',
          borderColor: 'var(--aws-border)',
        }}
        className="rounded-[8px] border p-3.5 shadow-none"
      >
        <div className="flex items-center gap-1.5 pb-2.5 mb-2 border-b border-[var(--aws-border)] text-[11px] font-bold uppercase tracking-wider text-[var(--aws-text-muted)]">
          <AlignLeft className="w-3.5 h-3.5 text-[#FF9900]" />
          <span>Contents</span>
        </div>

        <ul className="space-y-1 relative text-[12px]">
          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <li key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left py-1 px-2 rounded-[4px] transition-all flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? 'bg-[#FF9900]/10 text-[#FF9900] font-semibold pl-2.5'
                      : 'text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)]'
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {item.number && (
                      <span className="font-mono text-[10px] opacity-60">
                        {item.number}.
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </span>

                  {isActive && (
                    <ChevronRight
                      className="w-3.5 h-3.5 text-[#FF9900] shrink-0 animate-in fade-in duration-150"
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default DocToc;

