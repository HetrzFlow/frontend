import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { BN, ROUND_MODE } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import { useGlobalStore } from '@/common';
import ListItem from '@/components/ListItem';

interface LeverageProps {
  nextLever?: string | BN;
  curLever?: string;
}
const Leverage: FC<LeverageProps> = ({ nextLever, curLever }) => {
  const { t } = useLingui();
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const dispNextLever = truncateFormat(nextLever, leverDecimal, {
    stripTrailingZeros: true,
    round: ROUND_MODE.ROUND,
  });
  return (
    curLever && (
      <ListItem
        label={t`Leverage`}
        value={
          dispNextLever !== EMPTY_DISPLAY ? (
            <>
              <span className="text-t-270">
                {truncateFormat(curLever, leverDecimal, {
                  stripTrailingZeros: true,
                  round: ROUND_MODE.ROUND,
                })}
                x{' → '}
              </span>
              {dispNextLever}x
            </>
          ) : (
            dispNextLever
          )
        }
      />
    )
  );
};

export default memo(Leverage);
