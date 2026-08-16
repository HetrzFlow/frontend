interface ErrorLike {
  code?: unknown;
  errMsg?: unknown;
  message?: unknown;
  shortMessage?: unknown;
  cause?: unknown;
}

const getErrorChain = (error: unknown) => {
  const chain: ErrorLike[] = [];
  const visited = new Set<object>();
  let current = error;

  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const errorLike = current as ErrorLike;
    chain.push(errorLike);
    current = errorLike.cause;
  }

  return chain;
};

const getFirstLine = (value: unknown) =>
  typeof value === 'string' ? value.split('\n')[0]?.trim() : undefined;

const getApiErrorMessage = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  try {
    const parsed = JSON.parse(value) as { msg?: unknown; message?: unknown };
    return getFirstLine(parsed.msg) ?? getFirstLine(parsed.message);
  } catch {
    return getFirstLine(value);
  }
};

export const getGenesisActionErrorMessage = ({
  error,
  rejectedMessage,
  fallbackMessage,
}: {
  error: unknown;
  rejectedMessage: string;
  fallbackMessage: string;
}) => {
  const errorChain = getErrorChain(error);
  const isRejected = errorChain.some((item) => {
    if (item.code === 4001 || item.code === 'ACTION_REJECTED') return true;

    const message = `${getFirstLine(item.shortMessage) ?? ''} ${
      getFirstLine(item.message) ?? ''
    }`.toLowerCase();

    return (
      message.includes('user rejected') ||
      message.includes('user denied') ||
      message.includes('request rejected')
    );
  });

  if (isRejected) return rejectedMessage;

  for (const item of errorChain) {
    const message =
      getFirstLine(item.shortMessage) ??
      getFirstLine(item.message) ??
      getApiErrorMessage(item.errMsg);
    if (message) return message;
  }

  return fallbackMessage;
};
