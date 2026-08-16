import { FC, useDeferredValue, useMemo, useRef, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { debounce } from 'lodash-es';
import { Button, cn, Input } from '@repo/ui';
import { measureSuiRpcLatency } from '../../../services/rest/rpc';

interface CustomRPCInputProps {
  value?: string;
  onSave: (value: string) => void;
  onValueChange: (value: string) => void;
}

const CustomRPCInput: FC<CustomRPCInputProps> = ({
  value,
  onSave,
  onValueChange,
}) => {
  const { t } = useLingui();
  const [inputValue, setInputValue] = useState(value);
  const deferredValue = useDeferredValue(inputValue);
  const [isPending, setIsPending] = useState(false);
  const [isFetchError, setIsFetchError] = useState(false);
  const abortControllerRef = useRef<AbortController>(null);
  const hasErrorRef = useRef(false);

  const hasError = useMemo(() => {
    if (isFetchError) return true;
    if (!deferredValue) return false;
    try {
      new URL(deferredValue);
      return !deferredValue.startsWith('https://');
    } catch {
      return true;
    }
  }, [deferredValue, isFetchError]);
  hasErrorRef.current = hasError;

  const handleCustomRPCInput = useMemo(
    () =>
      debounce(async (_value, onSuccess = () => {}, onFailed = () => {}) => {
        if (!_value || hasErrorRef.current) {
          onFailed();
          return;
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }

        abortControllerRef.current = new AbortController();

        measureSuiRpcLatency(_value, abortControllerRef.current.signal)
          .then(() => {
            onSuccess(_value);
          })
          .catch(() => {
            setIsFetchError(true);
            onFailed();
          })
          .finally(() => {
            abortControllerRef.current = null;
          });
      }, 800),
    [],
  );

  return (
    <div
      className="mt-2 flex w-full flex-col gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Input
        autoFocus
        variant="ghost"
        className={cn('px-3', hasError ? 'border-destructive!' : '')}
        inputClassName="text-sm"
        value={inputValue}
        placeholder={t`Custom RPC URL`}
        onChange={(e) => {
          setInputValue(e.target.value);
          handleCustomRPCInput(e.target.value, onValueChange);
          setIsFetchError(false);
        }}
        onFocus={() => {
          setIsFetchError(false);
        }}
        suffix={
          <Button
            variant="ghost"
            size="sm"
            disabled={hasError || !deferredValue}
            className="h-auto bg-transparent p-0 hover:bg-transparent hover:text-inherit"
            onClick={() => {
              setIsPending(true);
              handleCustomRPCInput(
                inputValue,
                (_value: string) => {
                  onSave(_value);
                  setIsPending(false);
                },
                () => {
                  setIsPending(false);
                },
              );
            }}
          >
            {isPending ? t`Checking...` : t`Save`}
          </Button>
        }
      />
      {hasError && (
        <span className="text-destructive">{t`Invalid URL. Please verify and try again.`}</span>
      )}
    </div>
  );
};

export default CustomRPCInput;
