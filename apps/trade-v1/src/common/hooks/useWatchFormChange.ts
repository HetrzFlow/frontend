import { useEffect } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';

// watch form change
export const useWatchFormChange = <T extends FieldValues>(
  form: UseFormReturn<T, any, undefined>,
  onChange?: (value: Record<string, any>) => void,
) => {
  useEffect(() => {
    const sub = form.watch((data) => onChange && onChange(data));
    return () => {
      sub.unsubscribe();
    };
  }, [form, onChange]);
};
