import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { BN } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import { useGlobalStore } from '@/common';
import ListItem from '@/components/ListItem';

interface CollateralProps {
  nextCollateral?: string | BN;
  curCollateral?: string | BN;
  hasPosition?: boolean;
}
const Collateral: FC<CollateralProps> = ({
  hasPosition,
  nextCollateral,
  curCollateral,
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const dispNextCollateral = truncateFormat(
    nextCollateral,
    usdAmountDisplayDecimal,
    {
      style: 'currency',
      currency: 'USD',
    },
  );

  const hasNextCollateral = dispNextCollateral !== EMPTY_DISPLAY;
  const dispCurCollateral = truncateFormat(
    curCollateral,
    usdAmountDisplayDecimal,
    {
      style: 'currency',
      currency: 'USD',
    },
  );

  return (
    <ListItem
      label={t`Collateral`}
      value={
        hasPosition && hasNextCollateral ? (
          <>
            <span className="text-t-270">
              {dispCurCollateral}
              {' → '}
            </span>
            {dispNextCollateral}
          </>
        ) : hasPosition ? (
          dispCurCollateral
        ) : (
          dispNextCollateral
        )
      }
    />
  );
};

export default Collateral;
