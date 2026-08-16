import { useEffect } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';

export const useWatchFormChange = <T extends FieldValues>(
  form: UseFormReturn<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (value: Record<string, any>) => void,
) => {
  useEffect(() => {
    const sub = form.watch((data) => onChange && onChange(data));
    return () => {
      sub.unsubscribe();
    };
  }, [form, onChange]);
};
