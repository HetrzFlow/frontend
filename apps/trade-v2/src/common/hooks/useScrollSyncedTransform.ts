'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_SCROLL_ROOT_SELECTOR = 'main[data-app-scroll]';
const DEFAULT_INITIAL_TRANSFORM = 'translate3d(0, 0, 0)';

type ScrollSyncSchedule = 'immediate' | 'raf';

interface UseScrollSyncedTransformOptions {
  enabled?: boolean;
  getTransform?: (scrollTop: number) => string;
  initialTransform?: string;
  observeScrollRoot?: boolean;
  schedule?: ScrollSyncSchedule;
  scrollRootSelector?: string;
}

function getDefaultTransform(scrollTop: number) {
  const offset = Math.max(0, scrollTop);
  return `translate3d(0, -${offset}px, 0)`;
}

export default function useScrollSyncedTransform({
  enabled = true,
  getTransform = getDefaultTransform,
  initialTransform = DEFAULT_INITIAL_TRANSFORM,
  observeScrollRoot = false,
  schedule = 'immediate',
  scrollRootSelector = DEFAULT_SCROLL_ROOT_SELECTOR,
}: UseScrollSyncedTransformOptions = {}) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!enabled || !target) return;

    let scrollRoot: HTMLElement | null = null;
    let frameId: number | null = null;
    let currentTransform = initialTransform;

    const findScrollRoot = () =>
      document.querySelector<HTMLElement>(scrollRootSelector);

    const applyTransform = () => {
      frameId = null;
      if (!scrollRoot) return;

      const nextTransform = getTransform(scrollRoot.scrollTop);
      if (nextTransform === currentTransform) return;

      currentTransform = nextTransform;
      target.style.transform = nextTransform;
    };

    const onScroll =
      schedule === 'raf'
        ? () => {
            if (frameId !== null) return;
            frameId = window.requestAnimationFrame(applyTransform);
          }
        : applyTransform;

    const attachScrollRoot = (nextScrollRoot: HTMLElement | null) => {
      if (!nextScrollRoot || nextScrollRoot === scrollRoot) return;

      scrollRoot?.removeEventListener('scroll', onScroll);
      scrollRoot = nextScrollRoot;
      scrollRoot.addEventListener('scroll', onScroll, { passive: true });
      applyTransform();
    };

    attachScrollRoot(findScrollRoot());

    let observer: MutationObserver | null = null;
    if (!scrollRoot && observeScrollRoot) {
      observer = new MutationObserver(() => {
        const nextScrollRoot = findScrollRoot();
        if (!nextScrollRoot) return;

        attachScrollRoot(nextScrollRoot);
        observer?.disconnect();
        observer = null;
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      scrollRoot?.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      target.style.transform = '';
    };
  }, [
    enabled,
    getTransform,
    initialTransform,
    observeScrollRoot,
    schedule,
    scrollRootSelector,
  ]);

  return targetRef;
}
