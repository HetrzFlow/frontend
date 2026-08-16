'use client';

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { usePathname } from 'next/navigation';

const LAUNCHER_SIZE = 40;
const LONG_PRESS_DELAY = 250;
const DRAG_THRESHOLD = 6;

type LauncherPosition = { x: number; y: number };

export const clampLauncherPosition = (
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
): LauncherPosition => ({
  x: Math.max(0, Math.min(x, viewportWidth - LAUNCHER_SIZE)),
  y: Math.max(0, Math.min(y, viewportHeight - LAUNCHER_SIZE)),
});

export const hasExceededDragThreshold = (
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
) =>
  Math.abs(currentX - startX) > DRAG_THRESHOLD ||
  Math.abs(currentY - startY) > DRAG_THRESHOLD;

export const isTradePath = (pathname: string) =>
  /(?:^|\/)trade(?:\/|$)/.test(pathname);

export const isSwapLauncherPath = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const pageIndex =
    segments[0] === 'pools' || segments[0] === 'vaults'
      ? 0
      : segments[1] === 'pools' || segments[1] === 'vaults'
        ? 1
        : -1;

  return pageIndex >= 0 && segments.length - pageIndex <= 2;
};

export const isSwapLauncherInteraction = (
  container: Pick<HTMLElement, 'contains'> | null,
  target: EventTarget | null,
) =>
  !!target &&
  (!!container?.contains(target as Node) ||
    !!(target as Element).closest?.(
      '[data-swap-launcher-layer], .swap-launcher-layer',
    ));

export const hasOpenSwapLauncherChildLayer = (
  root: Pick<Document, 'querySelector'>,
) => !!root.querySelector('[data-swap-launcher-child-layer]');

export const useSwapLauncher = () => {
  const pathname = usePathname();
  const showLauncher = isSwapLauncherPath(pathname);
  const [open, setOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const [launcherPosition, setLauncherPosition] = useState<LauncherPosition>();
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | undefined>(undefined);
  const suppressClickTimerRef = useRef<number | undefined>(undefined);
  const openPanelFrameRef = useRef<number | undefined>(undefined);
  const dragRef = useRef<
    | {
        pointerId: number;
        startX: number;
        startY: number;
        offsetX: number;
        offsetY: number;
        active: boolean;
        cancelled: boolean;
      }
    | undefined
  >(undefined);
  const suppressClickRef = useRef(false);

  const clampToViewport = (x: number, y: number) =>
    clampLauncherPosition(
      x,
      y,
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    );

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== undefined) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  };

  const clearOpenPanelFrame = () => {
    if (openPanelFrameRef.current !== undefined) {
      window.cancelAnimationFrame(openPanelFrameRef.current);
      openPanelFrameRef.current = undefined;
    }
  };

  const openPanelAfterMount = () => {
    clearOpenPanelFrame();
    openPanelFrameRef.current = window.requestAnimationFrame(() => {
      openPanelFrameRef.current = window.requestAnimationFrame(() => {
        openPanelFrameRef.current = undefined;
        setOpen(true);
      });
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      active: false,
      cancelled: false,
    };
    longPressTimerRef.current = window.setTimeout(() => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId || drag.cancelled) return;
      drag.active = true;
      target.setPointerCapture(event.pointerId);
    }, LONG_PRESS_DELAY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.active) {
      if (
        hasExceededDragThreshold(
          drag.startX,
          drag.startY,
          event.clientX,
          event.clientY,
        )
      ) {
        drag.cancelled = true;
        clearLongPressTimer();
      }
      return;
    }

    event.preventDefault();
    setLauncherPosition(
      clampToViewport(
        event.clientX - drag.offsetX,
        event.clientY - drag.offsetY,
      ),
    );
  };

  const finishPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    clearLongPressTimer();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.active || drag.cancelled) {
      suppressClickRef.current = true;
      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
        suppressClickTimerRef.current = undefined;
      });
    }
    dragRef.current = undefined;
  };

  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      return;
    }
    if (!open) {
      setPanelKey((key) => key + 1);
      setOpen(true);
      return;
    }
    setOpen(false);
  };

  const closePanel = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (showLauncher) return;
    setOpen(false);
  }, [showLauncher]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (hasOpenSwapLauncherChildLayer(document)) return;
      if (!isSwapLauncherInteraction(containerRef.current, event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    const clampPositionOnResize = () => {
      setLauncherPosition((current) =>
        current ? clampToViewport(current.x, current.y) : current,
      );
    };

    window.addEventListener('resize', clampPositionOnResize);
    return () => window.removeEventListener('resize', clampPositionOnResize);
  }, []);

  useEffect(
    () => () => {
      clearLongPressTimer();
      clearOpenPanelFrame();
      if (suppressClickTimerRef.current !== undefined) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    },
    [],
  );

  return {
    showLauncher,
    open,
    panelKey,
    launcherPosition,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    finishPointer,
    handleClick,
    closePanel,
  };
};
