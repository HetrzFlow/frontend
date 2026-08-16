'use client';

import { useLingui } from '@lingui/react/macro';

import { Button, Dialog, DialogContent, DialogTitle, XIcon } from '@repo/ui';

import { SwapPanel } from './SwapPanel';
import { useSwapLauncher } from './useSwapLauncher';

const SwapLauncherIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.17 23.33H26.67V25H14.17V23.33Z"
      fill="black"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M25.83 15H13.33V16.67H25.83V15Z"
      fill="black"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.68 20.83L15.35 24.17L18.68 27.5L17.5 28.68L12.99 24.17L17.5 19.65L18.68 20.83Z"
      fill="black"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.32 12.5L24.65 15.83L21.32 19.17L22.5 20.34L27.01 15.83L22.5 11.32L21.32 12.5Z"
      fill="black"
    />
  </svg>
);

export const SwapWidget = () => {
  const { t } = useLingui();
  const launcher = useSwapLauncher();

  if (!launcher.showLauncher) return null;

  return (
    <div
      ref={launcher.containerRef}
      className="fixed right-5 bottom-[52px] z-[45] hidden size-10 md:block"
      style={
        launcher.launcherPosition
          ? {
              top: launcher.launcherPosition.y,
              right: 'auto',
              bottom: 'auto',
              left: launcher.launcherPosition.x,
            }
          : undefined
      }
    >
      <Dialog
        open={launcher.open}
        onOpenChange={(open) => {
          if (!open) launcher.closePanel();
        }}
      >
        <DialogContent
          data-swap-launcher-layer
          overlayClassName="swap-launcher-layer !z-40"
          closeClassName="hidden"
          className="bg-bg-3 md:data-[state=closed]:zoom-out-100 md:data-[state=open]:zoom-in-100 md:data-[state=closed]:slide-out-to-bottom-2 md:data-[state=open]:slide-in-from-bottom-2 !flex max-h-[calc(100dvh-120px)] !w-[340px] flex-col gap-0 overflow-y-auto rounded-xl p-2 md:top-auto md:right-5 md:bottom-[104px] md:left-auto md:translate-x-0 md:translate-y-0"
          aria-describedby={undefined}
        >
          <DialogTitle className="mb-2 text-lg leading-tight font-medium">
            {t`Swap`}
          </DialogTitle>
          <SwapPanel key={launcher.panelKey} variant="widget" />
        </DialogContent>
      </Dialog>
      <Button
        variant="ghost"
        size="icon"
        className="group bg-accent hover:bg-accent/70 aria-expanded:bg-accent aria-expanded:hover:bg-accent/70 aria-expanded:pointer-events-auto size-10 cursor-pointer touch-none rounded-full p-0 select-none"
        aria-label={launcher.open ? t`Close Swap` : t`Open Swap`}
        aria-expanded={launcher.open}
        onPointerDown={launcher.handlePointerDown}
        onPointerMove={launcher.handlePointerMove}
        onPointerUp={launcher.finishPointer}
        onPointerCancel={launcher.finishPointer}
        onClick={launcher.handleClick}
      >
        <span className="group-aria-expanded:hidden">
          <SwapLauncherIcon />
        </span>
        <XIcon
          size={24}
          className="hidden text-black group-aria-expanded:block"
        />
      </Button>
    </div>
  );
};
