'use client';

import { FC, useRef, useState } from 'react';

import { cn, TabsActiveBar } from '@repo/ui';

import News from './news';
import PortfolioTracker from './portfolioTracker';
import Rankings from './rankings';
import SectorMover from './sectorMover';
import SmartFlows from './smartFlows';

export interface ToolsProps {
  type?: 'popover' | 'dialog';
}

const tools = [
  { key: 'portfolioTracker', Component: PortfolioTracker },
  { key: 'sectorMover', Component: SectorMover },
  { key: 'news', Component: News },
  { key: 'smartFlows', Component: SmartFlows },
  { key: 'rankings', Component: Rankings },
] as const;

const Tools: FC<ToolsProps> = ({ type = 'popover' }) => {
  const activeTabRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeEle, setActiveEle] = useState<HTMLDivElement | null | undefined>(
    null,
  );

  return (
    <div className="relative flex items-center gap-2 max-md:flex-col">
      {tools.map(({ key, Component }) => (
        <div
          key={key}
          className="hover:text-t-270 h-6 cursor-pointer rounded-lg px-2 py-1 max-md:h-auto max-md:w-full max-md:px-4 max-md:py-3"
          ref={(el) => {
            activeTabRef.current[key] = el;
          }}
        >
          <Component
            type={type}
            onOpenChange={(open) => {
              if (open) {
                setActiveEle(activeTabRef.current[key]);
              } else {
                setActiveEle(null);
              }
            }}
          />
        </div>
      ))}
      <TabsActiveBar
        className={cn(
          'bg-bg-5 -z-1 h-6 rounded-lg px-2 py-1 max-md:h-10.5 max-md:w-full max-md:rounded-xl max-md:px-4 max-md:py-3',
        )}
        activeTabEle={activeEle as HTMLButtonElement | null | undefined}
      />
    </div>
  );
};

export default Tools;
