import {
  FC,
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
} from 'react';
import { useLingui } from '@lingui/react/macro';
import { intervalToDuration } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { useInstStore } from '@/common';
import { useMarketIsOpen } from '@/hooks/useMarketsStats';
import { getNextMarketTransition } from '@/lib/market/dateConverter';

const Content = ({ nextOpenTime }: { nextOpenTime: number | string }) => {
  const { t } = useLingui();
  const {
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
  } = intervalToDuration({
    start: Date.now(),
    end: nextOpenTime,
  });

  const countdownText = `${days}D:${hours < 10 ? `0${hours}` : hours}H:${minutes < 10 ? `0${minutes}` : minutes}M:${seconds < 10 ? `0${seconds}` : seconds}S`;

  return t`Trading and all related actions are unavailable during market closure. Market reopens in ${countdownText}.`;
};

interface MarketIsClosedTooltipProps {
  children: ReactNode;
  marketAddress?: string;
  asChild?: boolean;
}

function isButtonElement(
  children: ReactNode,
): children is ReactElement<{ disabled?: boolean }> {
  if (!isValidElement(children)) return false;

  if (children.type === 'button') return true;
  if (typeof children.type === 'string') return false;

  const componentType = children.type as {
    displayName?: string;
    name?: string;
  };

  return (
    componentType.displayName === 'Button' || componentType.name === 'Button'
  );
}

function renderDisabledChildren(children: ReactNode) {
  if (!isButtonElement(children)) return children;

  return cloneElement(children, {
    disabled: true,
  } as Partial<typeof children.props>);
}

const MarketIsClosedTooltip: FC<MarketIsClosedTooltipProps> = ({
  children,
  asChild = true,
  marketAddress,
}) => {
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[marketAddress || ''];

  const { data: isOpen } = useMarketIsOpen(inst);

  if (isOpen) return children;

  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-block cursor-not-allowed"
        asChild={asChild}
      >
        <div>
          <div
            className="pointer-events-none [&>svg]:opacity-50"
            onClickCapture={(e) => e.preventDefault()}
          >
            {renderDisabledChildren(children)}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" inDialog className="max-w-90">
        <Content
          nextOpenTime={
            getNextMarketTransition(inst?.schedule).nextOpenTime || Date.now()
          }
        />
      </TooltipContent>
    </Tooltip>
  );
};

export default MarketIsClosedTooltip;
