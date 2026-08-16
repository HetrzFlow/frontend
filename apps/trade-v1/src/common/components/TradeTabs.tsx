'use client';

import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TabsActiveBar,
  cn,
} from '@repo/ui';

import AnimationDiv from './AnimationDiv';

interface TradeTabsProps {
  className?: string;
  listClassName?: string;
  contentWrapClassName?: string;
  value: string;
  onValueChange?: (value: string) => void;
  options: {
    value: string;
    label: ReactNode;
    labelClassName?: string;
    activeBarClassName?: string;
    content: ReactNode;
  }[];
}

const TradeTabs: FC<TradeTabsProps> = ({
  className,
  listClassName,
  contentWrapClassName,
  value,
  options,
  onValueChange,
}) => {
  // handle tab animation
  const [activeTabEle, setActiveTabEle] = useState<
    HTMLButtonElement | null | undefined
  >();
  const activeTabRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeBarClassName = useMemo(() => {
    return Object.fromEntries(
      options.map(({ value, activeBarClassName }) => {
        return [value, activeBarClassName];
      }),
    );
  }, [options]);

  useEffect(() => {
    setActiveTabEle(activeTabRef.current[value]);
  }, [value]);

  // handle tab content animation
  const [animations, setAnimations] = useState<
    Record<string, [string, string, string]>
  >(() =>
    Object.fromEntries(
      options.map(({ value }) => [
        value,
        [value, 'translate-x-0 opacity-100', 'translate-x-0 opacity-100'],
      ]),
    ),
  );

  useEffect(() => {
    setTimeout(() => {
      // content in animation
      setAnimations((prevAnimations) => {
        const prevValue = Object.keys(prevAnimations).find(
          (key) => prevAnimations[key]?.[0] === value,
        );

        return {
          ...prevAnimations,
          [value]: [
            value,
            'translate-x-3 opacity-0',
            'translate-x-0 opacity-100',
          ],
          ...(prevValue && prevValue !== value
            ? {
                [prevValue]: [
                  prevValue,
                  'translate-x-0 opacity-100',
                  '-translate-x-3 opacity-0',
                ],
              }
            : {}),
        };
      });
    }, 300);
  }, [value]);

  return (
    <Tabs
      value={value}
      className={cn('w-full gap-5', className)}
      onValueChange={(_value) => {
        if (_value === value || !onValueChange) return;
        onValueChange(_value);

        // content exit animation
        setAnimations({
          ...animations,
          [value]: [
            _value,
            'translate-x-0 opacity-100',
            '-translate-x-3 opacity-0',
          ],
          [_value]: [
            value,
            'translate-x-3 opacity-0',
            'translate-x-0 opacity-100',
          ],
        });
      }}
    >
      <TabsList
        className={cn(
          'text-foreground grid w-full grid-cols-3 text-sm font-medium',
          listClassName,
        )}
      >
        {options.map(({ value, label, labelClassName }) => {
          return (
            <TabsTrigger
              key={value}
              ref={(el) => {
                activeTabRef.current[value] = el;
              }}
              className={cn(
                'data-[state=active]:text-accent-foreground hover:text-secondary-foreground h-[32px] rounded-full data-[state=active]:bg-transparent',
                labelClassName,
              )}
              value={value}
            >
              {label}
            </TabsTrigger>
          );
        })}
        <TabsActiveBar
          className={cn(
            'bg-accent -z-1 h-full rounded-full transition-[width,transform]',
            activeBarClassName[value],
          )}
          activeTabEle={activeTabEle}
        />
      </TabsList>
      <div className={contentWrapClassName}>
        {options.map(({ value, content }) => {
          return (
            <TabsContent key={value} value={animations[value]![0]}>
              <AnimationDiv
                initalClassName={animations[value]![1]}
                exitClassName={animations[value]![2]}
              >
                {content}
              </AnimationDiv>
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
};

export default TradeTabs;
