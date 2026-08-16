'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { MEDIA_SIZES, useMediaQuery } from '../lib/hooks';
import { cn } from '../lib/utils';

import { Popover, PopoverContent, PopoverTrigger } from './popover';

const CustomContext = React.createContext({
  isMobile: false,
});

function TooltipProvider({
  delayDuration = 200,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  open,
  closeOnScroll = true,
  defaultOpen,
  onOpenChange,
  modal,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root> & {
  closeOnScroll?: boolean;
  modal?: boolean;
}) {
  const mediaSize = useMediaQuery();
  const [isMounted, setIsMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(defaultOpen ?? false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  const isMobile =
    isMounted && mediaSize === MEDIA_SIZES.SM && open === undefined;

  React.useEffect(() => {
    if (!isMobile || !closeOnScroll || !mobileOpen) {
      return;
    }

    const close = () => {
      setMobileOpen(false);
      onOpenChange?.(false);
    };

    window.addEventListener('scroll', close, { capture: true, passive: true });
    window.addEventListener('touchmove', close, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('touchmove', close, { capture: true });
    };
  }, [closeOnScroll, isMobile, mobileOpen, onOpenChange]);

  return (
    <CustomContext.Provider value={{ isMobile: isMobile }}>
      {isMobile ? (
        <Popover
          {...props}
          modal={modal}
          defaultOpen={closeOnScroll ? undefined : defaultOpen}
          open={closeOnScroll ? mobileOpen : undefined}
          onOpenChange={(nextOpen) => {
            if (closeOnScroll) {
              setMobileOpen(nextOpen);
            }
            onOpenChange?.(nextOpen);
          }}
        />
      ) : (
        <TooltipProvider>
          <TooltipPrimitive.Root
            data-slot="tooltip"
            defaultOpen={defaultOpen}
            open={open}
            onOpenChange={onOpenChange}
            {...props}
          />
        </TooltipProvider>
      )}
    </CustomContext.Provider>
  );
}

function TooltipTrigger({
  type = 'button',
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const { isMobile } = React.useContext(CustomContext);
  if (isMobile) {
    return <PopoverTrigger {...props} />;
  }
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      type={type}
      {...props}
    />
  );
}

function TooltipPureContent({
  className,
  arrowClassName,
  sideOffset = 5,
  collisionPadding = 16,
  children,
  inDialog,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  inDialog?: boolean;
  arrowClassName?: string;
}) {
  return (
    <TooltipPrimitive.Content
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      className={cn(
        'bg-popover text-muted-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-2 py-1.5 text-xs text-wrap shadow-[0px_10px_40px_0_rgba(0,0,0,0.1)]',
        inDialog ? 'bg-popover-2' : '',
        className,
      )}
      collisionPadding={collisionPadding}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow
        className={cn(
          'bg-popover fill-popover z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-xs',
          inDialog ? 'bg-popover-2 fill-popover-2' : '',
          arrowClassName,
        )}
      />
    </TooltipPrimitive.Content>
  );
}

function TooltipContent({
  className,
  inDialog,
  arrowClassName,
  container,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  arrowClassName?: string;
  inDialog?: boolean;
  container?: Element | DocumentFragment | null;
}) {
  const { isMobile } = React.useContext(CustomContext);
  if (isMobile) {
    return (
      <PopoverContent
        className={cn(
          'text-muted-foreground rounded-md px-2 py-1.5 text-xs',
          inDialog ? 'bg-popover-2' : '',
          className,
        )}
        showArrow
        arrowClassName={cn(
          inDialog ? 'bg-popover-2 fill-popover-2' : '',
          arrowClassName,
        )}
        onOpenAutoFocus={inDialog ? (e) => e.preventDefault() : undefined}
        container={container}
        {...props}
      />
    );
  }
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPureContent
        className={className}
        inDialog={inDialog}
        arrowClassName={arrowClassName}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
