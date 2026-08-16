export type Logger = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export function createLogger(isEnabled: () => boolean): Logger {
  return {
    info: (...args: unknown[]) => {
      if (isEnabled()) {
        console.log(...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (isEnabled()) {
        console.warn(...args);
      }
    },
    error: (...args: unknown[]) => {
      if (isEnabled()) {
        console.error(...args);
      }
    },
  };
}
