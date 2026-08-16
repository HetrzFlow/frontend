import { useEffect } from 'react';
import type { DeepPartial, FieldValues, UseFormReturn } from 'react-hook-form';

// watch form change
export const useWatchFormChange = <T extends FieldValues>(
  form: UseFormReturn<T>,

  onChange?: (value: DeepPartial<T>) => void,
) => {
  useEffect(() => {
    const sub = form.watch((data) => onChange && onChange(data));
    return () => {
      sub.unsubscribe();
    };
  }, [form, onChange]);
};
