'use client';

import {
  CSSProperties,
  FC,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn, Tabs, TabsActiveBar, TabsList, TabsTrigger } from '@repo/ui';

interface OrderTypeTabsProps {
  value: string;
  onValueChange?: (value: string) => void;
  options: {
    value: string;
    label: ReactNode;
    activeBarProps?: {
      className?: string;
      style?: CSSProperties;
      widthCompensation?: number;
      xOffset?: number;
    };
    className?: string;
    disabled?: boolean;
  }[];
  className?: string;
  noBgChange?: boolean;
}

const OrderTypeTabs: FC<OrderTypeTabsProps> = ({
  value,
  onValueChange,
  options,
  className,
}) => {
  const [activeTabEle, setActiveTabEle] = useState<
    HTMLButtonElement | null | undefined
  >();

  const activeTabRef = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setActiveTabEle(activeTabRef.current[value]);
  }, [value]);

  const activeBarPropsMap = useMemo(() => {
    return Object.fromEntries(
      options.map(({ value, activeBarProps }) => {
        return [value, activeBarProps || {}];
      }),
    );
  }, [options]);

  const { className: activeBarClassName, ...activeBarProps } =
    activeBarPropsMap[value] || {};

  return (
    <Tabs
      value={value}
      className={cn('h-8 w-auto', className)}
      onValueChange={onValueChange}
    >
      <TabsList
        wrapClassName="h-full"
        className="flex h-full w-full gap-2 rounded-none font-medium"
      >
        {options.map(({ value, label, className, disabled }) => {
          return (
            <TabsTrigger
              key={value}
              ref={(el) => {
                activeTabRef.current[value] = el;
              }}
              className={cn(
                'rounded-none pt-1 pb-2 leading-tight data-[state=active]:bg-transparent',
                className,
              )}
              value={value}
              disabled={disabled}
              aria-controls={undefined}
            >
              {label}
            </TabsTrigger>
          );
        })}
        <TabsActiveBar
          className={cn('-z-1', activeBarClassName)}
          activeTabEle={activeTabEle}
          {...activeBarProps}
        />
      </TabsList>
    </Tabs>
  );
};

export default OrderTypeTabs;
