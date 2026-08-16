import { useLingui } from '@lingui/react/macro';
import { Button, Popover, PopoverAnchor, PopoverContent } from '@repo/ui';

import { TRADE_TYPE } from '@/constants/enum';

export interface ChartLimitOrderMenuState {
  x: number;
  y: number;
  limitPrice: string;
  formattedPrice: string;
  tradeType: TRADE_TYPE.long | TRADE_TYPE.short;
  disabledReason?: 'hyper' | 'stop-increase' | 'market-price-unavailable';
}

interface ChartLimitOrderMenuProps {
  state: ChartLimitOrderMenuState | null;
  onClose: () => void;
  onSelect: (limitPrice: string) => void;
}

const ChartLimitOrderMenu = ({
  state,
  onClose,
  onSelect,
}: ChartLimitOrderMenuProps) => {
  const { t } = useLingui();
  const formattedPrice = state?.formattedPrice ?? '';
  let label: string;
  if (state?.disabledReason === 'hyper') {
    label = t`Hyper mode: Market orders only`;
  } else if (state?.disabledReason === 'stop-increase') {
    label = t`Stop increase coming soon`;
  } else if (state?.disabledReason === 'market-price-unavailable') {
    label = t`Limit orders are currently unavailable`;
  } else {
    label =
      state?.tradeType === TRADE_TYPE.long
        ? t`Set Long Limit @ ${formattedPrice}`
        : t`Set Short Limit @ ${formattedPrice}`;
  }

  return (
    <Popover
      open={Boolean(state)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <PopoverAnchor asChild>
        <span
          className="pointer-events-none fixed size-0"
          style={{ left: state?.x ?? 0, top: state?.y ?? 0 }}
        />
      </PopoverAnchor>
      {state ? (
        <PopoverContent
          role="menu"
          side="left"
          align="start"
          sideOffset={14}
          collisionPadding={8}
          className="w-auto min-w-[220px]"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Button
            variant="ghost"
            role="menuitem"
            disabled={Boolean(state.disabledReason)}
            className="text-t-1100 hover:bg-bg-5 hover:text-t-1100 disabled:text-t-270 h-auto w-full justify-start rounded-lg px-3 py-2 text-left text-xs disabled:opacity-100 disabled:hover:bg-transparent"
            onClick={() => onSelect(state.limitPrice)}
          >
            {label}
          </Button>
        </PopoverContent>
      ) : null}
    </Popover>
  );
};

export default ChartLimitOrderMenu;
