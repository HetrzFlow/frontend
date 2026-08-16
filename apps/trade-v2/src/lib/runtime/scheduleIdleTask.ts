type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void) => number;
  cancelIdleCallback?: (id: number) => void;
};

export const scheduleIdleTask = (task: () => void, delayMs = 1200) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const idleWindow = window as IdleWindow;

  if (typeof idleWindow.requestIdleCallback === 'function') {
    const idleId = idleWindow.requestIdleCallback(() => task());
    return () => {
      if (typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleId);
      }
    };
  }

  const timer = window.setTimeout(task, delayMs);
  return () => window.clearTimeout(timer);
};
