import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { BN } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import { useInstStore } from '@/common';
import ListItem from '@/components/ListItem';
import { useGlobalStore } from '@/stores/trade/global';

interface LiqPxProps {
  hasPosition?: boolean;
  curLiqPrice: string | BN;
  nextLiqPrice: string | BN;
}

const LiqPx: FC<LiqPxProps> = ({ hasPosition, curLiqPrice, nextLiqPrice }) => {
  const { t } = useLingui();
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const coins = useInstStore((state) => state.getCoins());
  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;

  const dispCurLiqPrice = truncateFormat(curLiqPrice, pxDispDecimal, {
    style: 'currency',
    currency: 'USD',
  });

  const dispNextLiqPrice = truncateFormat(nextLiqPrice, pxDispDecimal, {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <ListItem
      label={t`Liq. Price`}
      value={
        hasPosition && dispNextLiqPrice !== EMPTY_DISPLAY ? (
          <>
            <span className="text-t-270">
              {dispCurLiqPrice}
              {' → '}
            </span>
            {dispNextLiqPrice}
          </>
        ) : (
          dispNextLiqPrice
        )
      }
    />
  );
};

export default memo(LiqPx);
