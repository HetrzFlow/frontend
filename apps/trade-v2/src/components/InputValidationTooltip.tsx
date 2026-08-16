'use client';

import { ComponentProps, ReactNode, useRef, useState } from 'react';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';

type TooltipContentProps = Omit<
  ComponentProps<typeof TooltipContent>,
  | 'children'
  | 'className'
  | 'onClick'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onPointerDownOutside'
>;

interface InputValidationTooltipProps {
  className?: string;
  triggerClassName: string;
  triggerValue: ReactNode;
  hasError: boolean;
  message?: ReactNode;
  onMessageClick?: () => void;
  tooltipContentClassName?: string;
  tooltipContentProps?: TooltipContentProps;
  children: (handlers: {
    onBlur: () => void;
    onFocus: () => void;
  }) => ReactNode;
  tooltipContainer?: Element;
}

const InputValidationTooltip = ({
  className,
  triggerClassName,
  triggerValue,
  hasError,
  message,
  onMessageClick,
  tooltipContentClassName,
  tooltipContentProps,
  children,
  tooltipContainer,
}: InputValidationTooltipProps) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const focusInputRef = useRef(false);
  const hoverInputRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeWhenIdle = () => {
    setTimeout(() => {
      if (!focusInputRef.current && !hoverInputRef.current) {
        setTooltipOpen(false);
      }
    }, 300);
  };

  const onFocus = () => {
    setTooltipOpen(true);
    focusInputRef.current = true;
  };

  const onBlur = () => {
    setTooltipOpen(false);
    focusInputRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onMouseEnter={() => {
        setTooltipOpen(true);
        hoverInputRef.current = true;
      }}
      onMouseLeave={() => {
        hoverInputRef.current = false;
        closeWhenIdle();
      }}
    >
      <Tooltip open={hasError && tooltipOpen}>
        <TooltipTrigger asChild>
          <div className={triggerClassName}>{triggerValue}</div>
        </TooltipTrigger>
        <TooltipContent
          container={tooltipContainer || containerRef.current}
          collisionBoundary={containerRef.current}
          className={cn(
            'flex cursor-pointer items-center',
            tooltipContentClassName,
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onClick={onMessageClick}
          onMouseEnter={() => {
            hoverInputRef.current = true;
          }}
          onMouseLeave={() => {
            hoverInputRef.current = false;
            closeWhenIdle();
          }}
          collisionPadding={1}
          {...tooltipContentProps}
        >
          {message}
        </TooltipContent>
      </Tooltip>
      {children({ onBlur, onFocus })}
    </div>
  );
};

export default InputValidationTooltip;
