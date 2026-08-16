import { useRef } from 'react';

interface UseStableDialogValueOptions {
  open: boolean;
  resetKey?: string;
}

export const useStableDialogValue = <T,>(
  value: T | null | undefined,
  { open, resetKey }: UseStableDialogValueOptions,
) => {
  const valueRef = useRef<T | null>(null);
  const resetKeyRef = useRef(resetKey);

  if (resetKeyRef.current !== resetKey) {
    resetKeyRef.current = resetKey;
    valueRef.current = value ?? null;
  } else if (value !== undefined && value !== null) {
    valueRef.current = value;
  } else if (!open) {
    valueRef.current = null;
  }

  return value ?? valueRef.current;
};
