import React, { useEffect, useState } from 'react';
import { m } from 'motion/react';
import { SPRING_SMOOTH } from '../../utils/motionTokens';

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
      className={`w-52 shrink-0 select-none hidden xl:block sticky top-20 ${className}`}
    >
      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-2.5 tracking-normal">
        On this page
      </div>

      <div className="relative border-l border-slate-200 dark:border-white/[0.08] py-0.5">
        <ul className="space-y-1 relative">
          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <li key={item.id} className="relative">
                {isActive && (
                  <m.span
                    layoutId="toc-active-bar"
                    className="absolute -left-[1px] top-1 bottom-1 w-[2px] bg-[#FF9900] rounded-full pointer-events-none"
                    transition={SPRING_SMOOTH}
                  />
                )}
                <button
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                className={`text-[12.5px] py-1 pl-3.5 transition-colors block text-left w-full truncate cursor-pointer ${isActive
                  ? 'text-[#FF9900] font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                title={item.label}
                    >
                <span className="truncate flex items-center gap-1.5">
                  {item.number && (
                    <span className="font-mono text-[10px] opacity-60">
                      {item.number}.
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </span>
              </button>
              </li>
        );
          })}
      </ul>
    </div>
    </nav >
  );
};

export default DocToc;
