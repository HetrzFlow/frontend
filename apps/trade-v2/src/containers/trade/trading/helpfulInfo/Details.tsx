import { FC } from 'react';
import type { BN } from '@repo/lib/calc';
import type { LossRebateEstimateResult } from '@/common/hooks/useLossRebateEstimate';

import Collateral from './Collateral';
import EntryPx from './EntryPx';
import Leverage from './Leverage';
import LiqPx from './LiqPx';
import LossRebate from './LossRebate';
import Slippage from './Slippage';

interface DetailsProps {
  hasPosition: boolean;
  isZFP: boolean;
  isCreditMarket?: boolean;
  curEntryPrice?: string | BN;
  nextEntryPrice?: string | BN;
  curSize: string | BN;
  curCollateral: string | BN;
  nextCollateral: string | BN;
  curLeverage: string | BN;
  nextLeverage?: string | BN;
  curLiqPrice: string | BN;
  nextLiqPrice: string | BN;
  lossRebateEstimate?: LossRebateEstimateResult;
  curPendingLossRebateUsd?: string;
  lossRebateRate?: bigint;
}

const Details: FC<DetailsProps> = ({
  hasPosition,
  isZFP,
  isCreditMarket,
  curEntryPrice,
  nextEntryPrice,
  curLeverage,
  nextLeverage,
  curLiqPrice,
  nextLiqPrice,
  lossRebateEstimate,
  curPendingLossRebateUsd,
  lossRebateRate,
  curCollateral,
  nextCollateral,
}) => {
  return (
    <>
      <Collateral
        hasPosition={hasPosition}
        curCollateral={curCollateral}
        nextCollateral={nextCollateral}
      />
      <Leverage
        hasPosition={hasPosition}
        curLever={curLeverage}
        nextLever={nextLeverage}
      />
      <EntryPx
        hasPosition={hasPosition}
        curEntryPrice={curEntryPrice}
        nextEntryPrice={nextEntryPrice}
      />
      <LiqPx
        hasPosition={hasPosition}
        curLiqPrice={curLiqPrice}
        nextLiqPrice={nextLiqPrice}
      />
      {!isCreditMarket && !isZFP && lossRebateEstimate?.isEligible && (
        <LossRebate
          curPendingLossRebateUsd={curPendingLossRebateUsd}
          nextEstimate={lossRebateEstimate}
          lossRebateRate={lossRebateRate}
        />
      )}
      <Slippage />
    </>
  );
};

export default Details;
