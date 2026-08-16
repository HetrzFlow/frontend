import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { BN, calc, ROUND_MODE } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useGlobalStore } from '@/common';
import ListItem from '@/components/ListItem';

interface LeverageProps {
  nextLever?: string | BN;
  curLever: string | BN;
  hasPosition?: boolean;
}
const Leverage: FC<LeverageProps> = ({ hasPosition, nextLever, curLever }) => {
  const { t } = useLingui();
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const dispNextLever = truncateFormat(nextLever, leverDecimal, {
    stripTrailingZeros: true,
    round: ROUND_MODE.ROUND,
  });

  const hasNextLeverage = !calc(nextLever || '').isNaN();
  const dispCurLeverage = truncateFormat(curLever, leverDecimal, {
    stripTrailingZeros: true,
    round: ROUND_MODE.ROUND,
  });

  return (
    curLever && (
      <ListItem
        label={t`Leverage`}
        value={
          hasPosition && hasNextLeverage ? (
            <>
              <span className="text-t-270">
                {dispCurLeverage}x{' → '}
              </span>
              {dispNextLever}x
            </>
          ) : hasPosition ? (
            `${dispCurLeverage}x`
          ) : (
            `${dispNextLever}x`
          )
        }
      />
    )
  );
};

export default Leverage;
