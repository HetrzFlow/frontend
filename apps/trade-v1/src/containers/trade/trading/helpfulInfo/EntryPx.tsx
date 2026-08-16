import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { BN } from '@repo/lib/calc';
import { EMPTY_DISPLAY, percentFormat, truncateFormat } from '@repo/lib/format';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { useInstStore } from '@/common';

import ListItem from '@/components/ListItem';
import { useGlobalStore } from '@/stores/trade/global';
import { usePreferenceStore } from '@/stores/trade/preference';
import { useTradeStore } from '../store';

interface EntryPxProps {
  hasPosition: boolean;
  curEntryPrice?: string | BN;
  nextEntryPrice?: string | BN;
}

const EntryPx: FC<EntryPxProps> = ({
  hasPosition,
  curEntryPrice,
  nextEntryPrice,
}) => {
  const { t } = useLingui();
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const coins = useInstStore((state) => state.getCoins());
  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;
  const slippage = usePreferenceStore((state) => state.slippage);
  const dispSlippage = percentFormat(slippage);
  const smDialogOpen = useTradeStore((state) => state.smDialogOpen);

  const dispCurEntryPrice = truncateFormat(curEntryPrice, pxDispDecimal, {
    style: 'currency',
    currency: 'USD',
  });
  const dispNextEntryPrice = truncateFormat(nextEntryPrice, pxDispDecimal, {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <ListItem
      label={t`Entry Price`}
      value={
        hasPosition && dispNextEntryPrice !== EMPTY_DISPLAY ? (
          <>
            <span className={'text-t-270'}>{dispCurEntryPrice}</span>
            <span className="text-secondary-foreground">{' → '}</span>
            <Tooltip>
              <TooltipTrigger
                className={cn(
                  'decoration-t-430 underline decoration-dotted underline-offset-3',
                )}
              >
                {dispNextEntryPrice}
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="w-[224px]"
                inDialog={smDialogOpen}
              >
                <p>{t`Your current position's entry price will change from ${
                  dispCurEntryPrice
                } to ${dispNextEntryPrice}.`}</p>
              </TooltipContent>
            </Tooltip>
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger
              className={cn(
                'decoration-t-430 decoration-dotted underline-offset-3',
                dispNextEntryPrice === EMPTY_DISPLAY
                  ? 'cursor-auto no-underline'
                  : 'underline',
              )}
            >
              {dispNextEntryPrice}
            </TooltipTrigger>

            {dispNextEntryPrice !== EMPTY_DISPLAY && (
              <TooltipContent
                side="left"
                className="w-[224px]"
                inDialog={smDialogOpen}
              >
                <p>{t`The position opens at ${dispNextEntryPrice} with a maximum ${
                  dispSlippage
                } slippage. Adjust the slippage amount via the trading panel.`}</p>
              </TooltipContent>
            )}
          </Tooltip>
        )
      }
    />
  );
};

export default memo(EntryPx);
