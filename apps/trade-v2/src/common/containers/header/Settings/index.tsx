'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  SettingsIcon,
  useMediaQuery,
  MEDIA_SIZES,
  Skeleton,
} from '@repo/ui';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Skeleton className="bg-bg-5 h-10 rounded-lg" />,
});

const Settings: React.FC = () => {
  const mediaSz = useMediaQuery();
  const [open, setOpen] = useState(false);
  const [panelId, setPanelId] = useState('');

  return (
    <Popover
      open={open}
      onOpenChange={(_open) => {
        if (!_open) {
          setPanelId('');
        }
        setOpen(_open);
      }}
    >
      <PopoverTrigger
        aria-label="settings"
        className="text-primary-foreground hover:bg-bg-4 bg-bg-3 flex size-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl transition-none duration-300 hover:transition-[background]"
      >
        <SettingsIcon className="cursor-pointer" size={20} />
      </PopoverTrigger>

      <PopoverContent
        sideOffset={mediaSz === MEDIA_SIZES.SM ? 12 : 12}
        align="end"
        className="w-70 max-md:w-[calc(100vw-calc(var(--spacing)*8))]"
      >
        <Content panelId={panelId} />
      </PopoverContent>
    </Popover>
  );
};

export default Settings;
