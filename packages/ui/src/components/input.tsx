import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';
import { Skeleton } from './skeleton';

type ExtendedInputProps = Omit<React.ComponentProps<'input'>, 'prefix'> & {
  size?: 'default';
  variant?: 'default' | 'ghost';
  label?: React.ReactNode;
  inputWrapClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  prefixClassname?: string;
  suffixClassName?: string;
  extraClassName?: string;
  extra?: React.ReactNode;
  innerExtraClassName?: string;
  innerExtra?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  innerPrefix?: string;
  innerSuffix?: string;
  isLoading?: boolean;
  keepInputOnLoading?: boolean;
  preservePrecision?: boolean;
  onValueChange?: (value: string, input: HTMLInputElement) => void;
};

const inputWrapVariants = cva(
  'border bg-bg-3 rounded-xl focus-within:ring-0 focus-within:outline-0 has-disabled:bg-transparent has-disabled:border-border focus-within:border-input',
  {
    variants: {
      variant: {
        default: 'border-input focus-within:border-input',
        ghost: 'border-transparent',
      },
      size: {
        default: 'px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Input = React.forwardRef<HTMLInputElement, ExtendedInputProps>(
  (
    {
      className,
      type,
      label,
      value,
      inputWrapClassName,
      inputClassName,
      labelClassName,
      prefixClassname,
      suffixClassName,
      extraClassName,
      id,
      prefix,
      suffix,
      extra,
      innerExtraClassName,
      innerExtra,
      innerPrefix,
      innerSuffix,
      variant,
      size,
      isLoading,
      keepInputOnLoading,
      onValueChange,
      onInput,
      onClick,
      onKeyUp,
      ...props
    },
    ref,
  ) => {
    const innerId = React.useId();
    const innerPrefixLength = (innerPrefix || '').length;
    const innerSuffixLength = (innerSuffix || '').length;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      if (innerPrefixLength) {
        newValue = newValue.slice(innerPrefixLength);
      }
      if (innerSuffixLength) {
        newValue = newValue.slice(0, -innerSuffixLength);
      }
      onValueChange?.(newValue, e.target);
    };

    // innerPrefix and innerSuffix
    const formatValue = React.useMemo(() => {
      if (innerPrefix || innerSuffix) {
        return `${innerPrefix || ''}${value ?? ''}${innerSuffix || ''}`;
      }

      return value;
    }, [value, innerPrefix, innerSuffix]);

    // handle cursor, not move to innerPrefix and innerSuffix
    const handleSelection = (input: HTMLInputElement) => {
      const valueLength = input.value.length;
      const start = innerPrefixLength;
      const end = valueLength - innerSuffixLength;

      if ((input.selectionStart || 0) < start) {
        input.setSelectionRange(start, start);
      } else if ((input.selectionStart || 0) > end) {
        input.setSelectionRange(end, end);
      }
    };

    const [fontSize, setFontSize] = React.useState<number | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const measureRef = React.useRef<HTMLSpanElement>(null);
    const inputWidthRef = React.useRef<number>(0);

    React.useImperativeHandle(
      ref,
      () => inputRef.current as HTMLInputElement,
      [],
    );

    React.useEffect(() => {
      if (inputRef.current && !fontSize && measureRef.current) {
        measureRef.current.style.fontSize = '12px';
        const measureBoxstyle = window.getComputedStyle(measureRef.current);
        const textScale = parseFloat(measureBoxstyle.fontSize) / 12;

        // set initial font size
        const style = window.getComputedStyle(inputRef.current);
        const baseSize = parseFloat(style.fontSize) / textScale;
        inputWidthRef.current = inputRef.current.offsetWidth;
        setFontSize(baseSize);
      }
    }, [fontSize]);

    // cache inputWidth via ResizeObserver to avoid forced reflow on value change
    React.useEffect(() => {
      if (!inputRef.current) return;
      const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
          inputWidthRef.current = entries[0].contentRect.width;
        }
      });
      observer.observe(inputRef.current);
      return () => observer.disconnect();
    }, []);

    // auto font size
    React.useEffect(() => {
      if (!inputRef.current || !measureRef.current || fontSize == null) return;
      const input = inputRef.current;
      const measure = measureRef.current;

      measure.textContent = (value as string) || input.placeholder;
      measure.style.fontSize = `${fontSize}px`;

      // defer offsetWidth read to avoid forced reflow after DOM writes above
      requestAnimationFrame(() => {
        const inputWidth = inputWidthRef.current;
        const textWidth = measure.offsetWidth;
        if (textWidth > inputWidth) {
          //  set font size: 8px offset
          const scale = (inputWidth - 8) / textWidth;
          input.style.fontSize = `${fontSize * scale}px`;
        } else {
          // reset to initial font size
          input.style.fontSize = '';
        }
      });
    }, [value, fontSize]);

    return (
      <label
        tabIndex={-1}
        className={cn(
          'grid gap-3',
          inputWrapVariants({ variant, size }),
          className,
        )}
      >
        {label && (
          <div
            className={cn(
              'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              labelClassName,
            )}
          >
            {label}
          </div>
        )}
        <div className={'min-w-0'}>
          <div
            className={cn(
              'flex min-w-0 items-center has-disabled:cursor-not-allowed',
              inputWrapClassName,
            )}
          >
            {prefix && (
              <span
                className={cn(
                  'flex shrink-0 items-center self-stretch pr-3 text-sm',
                  prefixClassname,
                )}
              >
                {prefix}
              </span>
            )}
            <Skeleton
              className={cn(
                'h-full w-full min-w-0 shrink grow',
                isLoading && !keepInputOnLoading ? 'block' : 'hidden',
              )}
            />

            <div
              className={cn(
                'flex h-auto min-h-min min-w-0 shrink grow flex-col justify-center self-stretch',
                isLoading && !keepInputOnLoading ? 'hidden' : 'flex',
              )}
            >
              <input
                type={type ?? 'text'}
                className={cn(
                  'file:text-foreground placeholder:text-t-430 flex h-[20px] w-full bg-transparent text-base leading-[inherit] font-medium transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:font-normal focus-visible:outline-none disabled:pointer-events-none',
                  inputClassName,
                )}
                id={id || innerId}
                ref={inputRef}
                value={formatValue}
                onChange={handleChange}
                onInput={(e) => {
                  handleSelection(e.target as HTMLInputElement);
                  if (onInput) {
                    onInput(e);
                  }
                }}
                onClick={(e) => {
                  handleSelection(e.target as HTMLInputElement);
                  if (onClick) {
                    onClick(e);
                  }
                }}
                onKeyUp={(e) => {
                  handleSelection(e.target as HTMLInputElement);
                  if (onKeyUp) {
                    onKeyUp(e);
                  }
                }}
                autoComplete="off"
                {...props}
              />
              <span
                ref={measureRef}
                className={cn('!invisible !fixed', inputClassName)}
              />
              {innerExtra && (
                <div
                  className={cn(
                    'text-t-270 mt-1 truncate text-sm',
                    innerExtraClassName,
                  )}
                >
                  {innerExtra}
                </div>
              )}
            </div>
            {suffix && (
              <span
                className={cn(
                  'flex shrink-0 items-center self-stretch pl-3',
                  suffixClassName,
                )}
              >
                {suffix}
              </span>
            )}
          </div>
          {extra && (
            <div
              className={cn(
                'text-muted-foreground mt-3 truncate text-sm',
                extraClassName,
              )}
            >
              {extra}
            </div>
          )}
        </div>
      </label>
    );
  },
);

Input.displayName = 'Input';

// format number
function formatNumber(value?: string | number, decimal: number = 2): string {
  if (!value) {
    return '';
  }
  const [integer = '', _decimal = ''] = `${value}`.split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedDecimal =
    decimal !== 0 && (`${value}`.endsWith('.') || _decimal)
      ? `.${decimal === undefined ? _decimal : _decimal.slice(0, decimal)}`
      : '';
  return `${formattedInteger}${formattedDecimal}`;
}

function normalizeInputNumberValue(
  value: string,
  locale: Intl.LocalesArgument = 'en-US',
): string {
  const fractionLength = value.split('.')[1]?.length || 0;

  if (value.endsWith('.')) {
    return `${(+value).toLocaleString(locale, {
      useGrouping: false,
      minimumFractionDigits: 0,
    })}.`;
  }

  return `${(+value).toLocaleString(locale, {
    useGrouping: false,
    minimumFractionDigits: fractionLength,
  })}`;
}

function normalizePreciseInputNumberValue(value: string): string {
  const negative = value.startsWith('-');
  const unsignedValue = negative ? value.slice(1) : value;
  const hasDecimalPoint = unsignedValue.includes('.');
  const [integer = '', fraction = ''] = unsignedValue.split('.');
  const normalizedInteger = integer.replace(/^0+(?=\d)/, '') || '0';

  return `${negative ? '-' : ''}${normalizedInteger}${
    hasDecimalPoint ? `.${fraction}` : ''
  }`;
}

// number input
const NumberInput = React.forwardRef<
  HTMLInputElement,
  ExtendedInputProps & {
    decimal?: number;
    maxLength?: number;
    locale?: Intl.LocalesArgument;
  }
>(
  (
    {
      value,
      onValueChange,
      onBlur,
      min = 0,
      max,
      decimal,
      maxLength,
      innerPrefix,
      locale = 'en-US',
      preservePrecision = false,
      ...props
    },
    ref,
  ) => {
    const formatValue = React.useMemo(() => {
      return formatNumber(value as string, decimal);
    }, [value, decimal]);

    const deferTimer = React.useRef<ReturnType<typeof setTimeout>>(null);

    const _handleChange = React.useCallback(
      (value: string, input: HTMLInputElement) => {
        if (max) {
          if (deferTimer.current) {
            clearTimeout(deferTimer.current);
          }
          deferTimer.current = setTimeout(() => {
            if (+value > +max) {
              onValueChange?.(`${max}`, input);
            }
          }, 200);
        }
        onValueChange?.(value, input);
      },
      [onValueChange, max],
    );

    const handleChange = React.useCallback(
      (value: string, input: HTMLInputElement) => {
        const innerPrefixLength = (innerPrefix || '').length;
        let cursorPosition = Math.max(
          0,
          (input.selectionStart || 0) - innerPrefixLength,
        );

        let finalValue = value.replace(/[^0-9.-]/g, '');
        const minusIndex = finalValue.indexOf('-');
        if (+min >= 0 || minusIndex > 0) {
          finalValue = finalValue.replace(/-/g, '');
        } else if (minusIndex === 0) {
          const match = finalValue.match(/-/g);
          if (match && match.length > 1) {
            finalValue = '-' + finalValue.replace(/-/g, '');
          }
        }

        if (maxLength !== undefined && finalValue.length > maxLength) {
          return;
        }

        if (decimal !== undefined) {
          const parts = finalValue.split('.');
          const decimalPart = parts[1];
          if (
            parts.length === 2 &&
            decimalPart &&
            decimalPart.length > decimal
          ) {
            finalValue = `${parts[0]}.${decimalPart.slice(0, decimal)}`;
          }
        }

        if (finalValue === '') {
          _handleChange?.('', input);
        } else if (finalValue === '-') {
          _handleChange?.('-', input);
        } else if (isNaN(+finalValue)) {
          finalValue = (
            value.slice(0, cursorPosition - 1) + value.slice(cursorPosition)
          ).replace(/[^0-9.-]/g, '');
          // cursor position -1
          cursorPosition -= 1;
          _handleChange?.(finalValue, input);
        } else if (preservePrecision) {
          finalValue = normalizePreciseInputNumberValue(finalValue);
          _handleChange?.(finalValue, input);
        } else if (finalValue.endsWith('.')) {
          finalValue = normalizeInputNumberValue(finalValue, locale);
          _handleChange?.(finalValue, input);
        } else {
          finalValue = normalizeInputNumberValue(finalValue, locale);
          _handleChange?.(finalValue, input);
        }

        // handle cursor position
        const formattedValue = formatNumber(finalValue, decimal);
        const commasBefore =
          value.slice(0, cursorPosition).match(/,/g)?.length || 0;
        const newCommasBefore =
          formattedValue.slice(0, cursorPosition).match(/,/g)?.length || 0;
        const diff = newCommasBefore - commasBefore;

        requestAnimationFrame(() => {
          const newCursorPosition = cursorPosition + diff + innerPrefixLength;
          input.setSelectionRange(newCursorPosition, newCursorPosition);
        });
      },
      [
        decimal,
        maxLength,
        min,
        innerPrefix,
        locale,
        preservePrecision,
        _handleChange,
      ],
    );

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (value === '') {
        onBlur?.(e);
        return;
      }

      if (+(value || 0) > +(max ?? Infinity)) {
        onValueChange?.(`${max}`, e.target);
        onBlur?.(e);
        return;
      }
      if (+(value || 0) < +(min ?? -Infinity)) {
        onValueChange?.(`${min}`, e.target);
        onBlur?.(e);
        return;
      }

      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        value={formatValue}
        innerPrefix={innerPrefix}
        onValueChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);

NumberInput.displayName = 'NumberInput';

export {
  Input,
  NumberInput,
  formatNumber,
  normalizePreciseInputNumberValue,
};
