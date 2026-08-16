import { FC, memo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui';
import { ENABLE_SWAP } from '@/constants/common';

import UnifiedTimeline from './UnifiedTimeline';
import type { ActivityView } from './types';

export type { ActivityView } from './types';

function ActivityChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M7.36 10.35C7.67 10.77 8.33 10.77 8.64 10.35L10.52 7.87C10.89 7.37 10.52 6.67 9.88 6.67H6.12C5.48 6.67 5.11 7.37 5.48 7.87L7.36 10.35Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ActivityTabLabel({
  value,
  onChange,
  onOpen,
}: {
  value: ActivityView;
  onChange: (value: ActivityView) => void;
  onOpen: () => void;
}) {
  const { t } = useLingui();
  const [menuLayout, setMenuLayout] = useState({
    width: 0,
    alignOffset: 0,
  });
  const syncMenuLayout = (trigger: HTMLElement) => {
    const tab = trigger.closest<HTMLElement>('[role="tab"]');
    if (!tab) return;
    const tabRect = tab.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    setMenuLayout({
      width: tabRect.width,
      alignOffset: tabRect.left - triggerRect.left,
    });
  };

  if (!ENABLE_SWAP) return <span>{t`Activity`}</span>;

  return (
    <span className="flex items-center gap-1">
      {t`Activity`}
      <DropdownMenu onOpenChange={(open) => open && onOpen()}>
        <DropdownMenuTrigger asChild>
          {/* react-doctor-disable-next-line prefer-tag-over-role */}
          <span
            role="button"
            tabIndex={0}
            aria-label={t`Activity`}
            className="flex size-4 shrink-0 items-center justify-center transition-opacity duration-300 hover:opacity-90"
            onPointerDown={(event) => {
              event.stopPropagation();
              syncMenuLayout(event.currentTarget);
            }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation();
              syncMenuLayout(event.currentTarget);
            }}
          >
            <ActivityChevronIcon />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          alignOffset={menuLayout.alignOffset}
          sideOffset={4}
          style={{ width: menuLayout.width || undefined }}
          className="bg-bg-3 rounded-xl border-0 p-2 drop-shadow-[-40px_10px_40px_rgba(0,0,0,0.1)]"
          onClick={(event) => event.stopPropagation()}
        >
          {(['trade', 'swap'] as const).map((option) => (
            <DropdownMenuItem
              key={option}
              className={cn(
                'text-t-1100 mb-2 h-[33px] cursor-pointer rounded-lg p-2 text-sm last:mb-0',
                value === option && 'bg-bg-4',
              )}
              onSelect={() => onChange(option)}
            >
              {option === 'trade' ? t`Trade` : t`Swap`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

const Activity: FC<{ view: ActivityView }> = ({ view }) => (
  <UnifiedTimeline view={view} />
);

export default memo(Activity);
