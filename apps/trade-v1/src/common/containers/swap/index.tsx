'use client';

import { useEffect, useState } from 'react';
import { cn, Drag, Popover, PopoverContent, PopoverTrigger } from '@repo/ui';
import Content from './Content';

const Swap = () => {
  const [open, setOpen] = useState(false);
  const [updateZ, setUpdateZ] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setUpdateZ(open);
      }, 300);
    } else {
      setUpdateZ(true);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <Drag
        className={cn('fixed right-6 bottom-16', open || updateZ ? 'z-51' : '')}
        offset={{ right: 72, bottom: 112 }}
      >
        <PopoverTrigger
          aria-label="open swap dialog"
          className="bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground/90 pointer-events-auto flex size-12 items-center justify-center rounded-full shadow-[0_4px_10px_0_rgba(0,223,235,0.5)] max-md:hidden"
        >
          <div
            className={cn(
              'relative size-3.5 transition-[rotate]',
              open ? 'rotate-180' : '',
            )}
          >
            <div
              className="bg-accent-foreground absolute size-3.5 -translate-y-[1px] scale-180 transition-[clip-path]"
              style={{
                clipPath: !open
                  ? 'path("M 2.3333 11 L 9.4334 11 L 7.925 12.5084 L 8.75 13.3333 L 11.6666 10.4166 L 8.75 7.5 L 7.925 8.3249 L 9.4334 9.8333 L 2.3333 9.8334 L 2.3333 11 Z")'
                  : 'path("M 4 5 L 7 8 L 9 10 L 9.5 10.5 L 10.5 9.5 L 10 9 L 8 7 L 7 6 L 4.5 3.5 L 3.5 4.5 Z")',
              }}
            />
            <div
              className="bg-accent-foreground absolute size-3.5 -translate-y-[1px] scale-180 transition-[clip-path]"
              style={{
                clipPath: !open
                  ? 'path("M 11.6666 5.1667 L 4.5666 5.1666 L 6.075 6.675 L 5.25 7.5 L 2.3333 4.5833 L 5.25 1.6667 L 6.075 2.4916 L 4.5666 4 L 11.6666 4 L 11.6666 5.1667 Z")'
                  : 'path("M 10 5 L 8 7 L 7 8 L 4.5 10.5 L 3.5 9.5 L 4 9 L 7 6 L 9 4 L 9.5 3.5 L 10.5 4.5 Z")',
              }}
            />
          </div>
        </PopoverTrigger>
      </Drag>
      {open && (
        <div
          className={cn(
            'pointer-events-auto fixed inset-0 z-50 bg-black/10 backdrop-blur-[10px]',
            open ? 'animate-in fade-in-0' : 'animate-out fade-out-0',
          )}
          onClick={() => setOpen(false)}
        />
      )}
      <PopoverContent
        side="top"
        sideOffset={16}
        align="end"
        className="data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom scrollbar-none max-h-[calc(100dvh-128px)] w-[388px] overflow-y-auto p-4 shadow-none"
        aria-describedby={undefined}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <Content />
      </PopoverContent>
    </Popover>
  );
};

Swap.displayName = 'Swap';

export default Swap;
