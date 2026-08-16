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
import HorizontalScrollBox from './HorizontalScrollBox/HorizontalScrollBox';

type ContentAnimation = 'slide' | 'height' | 'slide-height' | 'none';
type TabAnimation = [string, string, string];

const getDefaultTabAnimation = (value: string): TabAnimation => [
  value,
  'translate-x-0 opacity-100',
  'translate-x-0 opacity-100',
];

interface TradeTabsProps {
  className?: string;
  listWrapClassName?: string;
  listClassName?: string;
  horizontalContentClassName?: string;
  listLayoutClassName?: 'grid' | 'flex';
  labelClassName?: string;
  contentWrapClassName?: string;
  contentClassName?: string;
  animationClassName?: string;
  contentAnimation?: ContentAnimation;
  disableAnimation?: boolean;
  activeBarClassName?: string;
  sideContent?: ReactNode;
  value: string;
  onValueChange?: (value: string) => void;
  options: {
    value: string;
    label: ReactNode;
    labelClassName?: string;
    activeBarClassName?: string;
    content?: ReactNode;
    onTriggerHover?: () => void;
    onTriggerFocus?: () => void;
    onTriggerClick?: () => void;
  }[];
}

const getTabDomValue = (value: string, index: number) => {
  if (!/\s/.test(value)) return value;
  const normalizedValue = value.replace(/[^A-Za-z0-9_-]+/g, '-');
  return `tab-${index}-${normalizedValue || 'item'}`;
};

const TradeTabs: FC<TradeTabsProps> = ({
  className,
  listWrapClassName,
  listClassName,
  horizontalContentClassName,
  listLayoutClassName = 'grid',
  labelClassName: commonLabelClassName,
  activeBarClassName: commonActiveBarClassName,
  contentWrapClassName,
  contentClassName,
  animationClassName,
  contentAnimation,
  disableAnimation = false,
  sideContent,
  value,
  options,
  onValueChange,
}) => {
  // handle tab animation
  const [activeTabEle, setActiveTabEle] = useState<
    HTMLButtonElement | null | undefined
  >();
  const activeTabRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabDomValues = useMemo(() => {
    return Object.fromEntries(
      options.map(({ value }, index) => [value, getTabDomValue(value, index)]),
    );
  }, [options]);
  const tabValues = useMemo(() => {
    return Object.fromEntries(
      options.map(({ value }) => [tabDomValues[value], value]),
    );
  }, [options, tabDomValues]);
  const activeBarClassName = useMemo(() => {
    return Object.fromEntries(
      options.map(({ value, activeBarClassName }) => {
        return [value, activeBarClassName];
      }),
    );
  }, [options]);
  const optionValues = useMemo(
    () => new Set(options.map(({ value }) => value)),
    [options],
  );

  useEffect(() => {
    setActiveTabEle(activeTabRef.current[value]);
  }, [value]);

  // handle tab content animation
  const [animations, setAnimations] = useState<Record<string, TabAnimation>>(
    () =>
      Object.fromEntries(
        options.map(({ value }) => [value, getDefaultTabAnimation(value)]),
      ),
  );

  const resolvedContentAnimation =
    contentAnimation ?? (disableAnimation ? 'none' : 'slide');
  const hasSlideAnimation =
    resolvedContentAnimation === 'slide' ||
    resolvedContentAnimation === 'slide-height';
  const hasHeightAnimation =
    resolvedContentAnimation === 'height' ||
    resolvedContentAnimation === 'slide-height';

  useEffect(() => {
    if (!hasSlideAnimation) return;
    const timeoutId = setTimeout(() => {
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

    return () => clearTimeout(timeoutId);
  }, [value, hasSlideAnimation]);

  return (
    <Tabs
      value={tabDomValues[value] ?? value}
      className={cn('w-full gap-2', className)}
      onValueChange={(_domValue) => {
        const _value = tabValues[_domValue] ?? _domValue;
        if (_value === value || !onValueChange) return;
        onValueChange(_value);
        if (!hasSlideAnimation) return;

        // content exit animation
        setAnimations((prevAnimations) => ({
          ...prevAnimations,
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
        }));
      }}
    >
      {listLayoutClassName === 'grid' ? (
        <TabsList
          ref={tabListRef}
          wrapClassName={listWrapClassName}
          className={cn(
            'text-foreground w-full gap-2 text-sm font-medium',
            'grid grid-cols-3',
            listClassName,
          )}
        >
          {options.map(
            ({
              value,
              label,
              labelClassName,
              onTriggerHover,
              onTriggerFocus,
              onTriggerClick,
            }) => {
              return (
                <TabsTrigger
                  key={value}
                  ref={(el) => {
                    activeTabRef.current[value] = el;
                  }}
                  className={cn(
                    'data-[state=active]:text-accent-foreground text-t-270 hover:text-t-1100 z-2 h-[32px] rounded-xl data-[state=active]:bg-transparent',
                    commonLabelClassName,
                    labelClassName,
                  )}
                  value={tabDomValues[value] ?? value}
                  onMouseEnter={onTriggerHover}
                  onFocus={onTriggerFocus}
                  onClick={onTriggerClick}
                >
                  {label}
                </TabsTrigger>
              );
            },
          )}
          <TabsActiveBar
            className={cn(
              'bg-accent z-1 h-full rounded-xl transition-[width,transform]',
              commonActiveBarClassName,
              activeBarClassName[value],
            )}
            activeTabEle={activeTabEle}
            observerEle={tabListRef.current}
          />
        </TabsList>
      ) : (
        <HorizontalScrollBox
          className="w-full"
          contentClassName={cn(
            'flex items-center justify-between',
            horizontalContentClassName,
          )}
          sideContent={sideContent}
        >
          <TabsList
            ref={tabListRef}
            className={cn(
              'text-foreground flex flex-nowrap gap-2 text-sm/tight font-medium',
              listClassName,
            )}
          >
            {options.map(
              ({
                value,
                label,
                labelClassName,
                onTriggerHover,
                onTriggerFocus,
                onTriggerClick,
              }) => {
                return (
                  <TabsTrigger
                    key={value}
                    ref={(el) => {
                      activeTabRef.current[value] = el;
                    }}
                    className={cn(
                      'data-[state=active]:text-accent-foreground text-t-270 hover:text-t-1100 z-2 h-[32px] rounded-xl data-[state=active]:bg-transparent',
                      commonLabelClassName,
                      labelClassName,
                    )}
                    value={tabDomValues[value] ?? value}
                    onMouseEnter={onTriggerHover}
                    onFocus={onTriggerFocus}
                    onClick={onTriggerClick}
                  >
                    {label}
                  </TabsTrigger>
                );
              },
            )}
            <TabsActiveBar
              className={cn(
                'bg-accent z-1 h-full rounded-xl transition-[width,transform]',
                commonActiveBarClassName,
                activeBarClassName[value],
              )}
              activeTabEle={activeTabEle}
              observerEle={tabListRef.current}
            />
          </TabsList>
        </HorizontalScrollBox>
      )}
      <div className={contentWrapClassName}>
        {options.map(({ value: optionValue, content }) => {
          const animation =
            animations[optionValue] ?? getDefaultTabAnimation(optionValue);
          const contentValue =
            hasSlideAnimation && optionValues.has(animation[0])
              ? animation[0]
              : optionValue;
          const contentNode = hasSlideAnimation ? (
            <AnimationDiv
              className={animationClassName}
              initalClassName={animation[1]}
              exitClassName={animation[2]}
            >
              {content}
            </AnimationDiv>
          ) : (
            content
          );

          return (
            <TabsContent
              className={cn(
                hasHeightAnimation ? '' : 'h-full',
                hasHeightAnimation
                  ? 'grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out data-[state=active]:grid-rows-[1fr] data-[state=inactive]:grid-rows-[0fr]'
                  : '',
                contentClassName,
              )}
              key={optionValue}
              value={tabDomValues[contentValue] ?? contentValue}
              forceMount={hasHeightAnimation || undefined}
              aria-hidden={
                hasHeightAnimation
                  ? (tabDomValues[contentValue] ?? contentValue) !==
                    (tabDomValues[value] ?? value)
                  : undefined
              }
            >
              {hasHeightAnimation ? (
                <div className="min-h-0 overflow-hidden">{contentNode}</div>
              ) : (
                contentNode
              )}
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
};

export default TradeTabs;
