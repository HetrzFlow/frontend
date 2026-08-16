import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { BN } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { useInstStore } from '@/common';
import ListItem from '@/components/ListItem';

import { useGlobalStore } from '@/stores/trade/global';
import { useTradeStore } from '../store';

interface ExitPxProps {
  curPx?: string | BN;
}

const ExitPx: FC<ExitPxProps> = ({ curPx }) => {
  const { t } = useLingui();
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const coins = useInstStore((state) => state.getCoins());
  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;
  const dispExitPrice = truncateFormat(curPx, pxDispDecimal, {
    style: 'currency',
    currency: 'USD',
  });
  const smDialogOpen = useTradeStore((state) => state.smDialogOpen);
  return (
    <ListItem
      label={t`Exit Price`}
      value={
        <Tooltip>
          <TooltipTrigger
            className={cn(
              'decoration-t-430 decoration-dotted underline-offset-3',
              dispExitPrice === EMPTY_DISPLAY
                ? 'cursor-auto no-underline'
                : 'underline',
            )}
          >
            {dispExitPrice}
          </TooltipTrigger>
          {dispExitPrice !== EMPTY_DISPLAY && (
            <TooltipContent
              side="left"
              className="w-[224px]"
              inDialog={smDialogOpen}
            >
              <p>{t`Existing positions close at ${
                dispExitPrice
              }. Exit price subject to asset price changes.`}</p>
            </TooltipContent>
          )}
        </Tooltip>
      }
    />
  );
};

export default memo(ExitPx);
