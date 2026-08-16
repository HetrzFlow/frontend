type Timer = ReturnType<typeof setTimeout>;

export type Cancelable<Args extends unknown[], Result> = ((
  ...args: Args
) => Result | undefined) & {
  cancel: () => void;
};

export function debounce<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  wait: number,
): Cancelable<Args, Result> {
  let timer: Timer | undefined;

  const debounced = ((...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, wait);
    return undefined;
  }) as Cancelable<Args, Result>;

  debounced.cancel = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = undefined;
  };

  return debounced;
}

export function throttle<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  wait: number,
): Cancelable<Args, Result> {
  let lastRun = 0;
  let timer: Timer | undefined;
  let lastArgs: Args | undefined;
  let lastResult: Result | undefined;

  const run = (args: Args) => {
    lastRun = Date.now();
    lastResult = fn(...args);
    return lastResult;
  };

  const throttled = ((...args: Args) => {
    const now = Date.now();
    const remaining = wait - (now - lastRun);

    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      lastArgs = undefined;
      return run(args);
    }

    lastArgs = args;
    if (!timer) {
      timer = setTimeout(() => {
        timer = undefined;
        if (!lastArgs) return;
        const argsToRun = lastArgs;
        lastArgs = undefined;
        run(argsToRun);
      }, remaining);
    }

    return lastResult;
  }) as Cancelable<Args, Result>;

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    lastArgs = undefined;
  };

  return throttled;
}
