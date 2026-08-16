import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { BN } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import { useInstStore } from '@/common';
import ListItem from '@/components/ListItem';
import { useTradeGlobalStore } from '@/stores/trade/global';

interface LiqPxProps {
  hasPosition?: boolean;
  curLiqPrice: string | BN;
  nextLiqPrice: string | BN;
}

const LiqPx: FC<LiqPxProps> = ({ hasPosition, curLiqPrice, nextLiqPrice }) => {
  const { t } = useLingui();
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const pxDispDecimal = inst?.pxDispDecimal;

  const dispCurLiqPrice = truncateFormat(curLiqPrice, pxDispDecimal, {
    style: 'currency',
    currency: 'USD',
  });

  const dispNextLiqPrice = truncateFormat(nextLiqPrice, pxDispDecimal, {
    style: 'currency',
    currency: 'USD',
  });

  const hasNextLiqPrice = dispNextLiqPrice !== EMPTY_DISPLAY;

  return (
    <ListItem
      label={t`Liq. Price`}
      value={
        hasPosition && hasNextLiqPrice ? (
          <>
            <span className="text-t-270">
              {dispCurLiqPrice}
              {' → '}
            </span>
            {dispNextLiqPrice}
          </>
        ) : hasPosition ? (
          dispCurLiqPrice
        ) : (
          dispNextLiqPrice
        )
      }
    />
  );
};

export default memo(LiqPx);
