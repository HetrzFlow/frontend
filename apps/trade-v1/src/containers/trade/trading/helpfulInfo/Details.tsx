import { FC } from 'react';
import type { BN } from '@repo/lib/calc';
import type { Position } from '@/common';

import EntryPx from './EntryPx';
import Leverage from './Leverage';
import LiqPx from './LiqPx';
import Slippage from './Slippage';

interface DetailsProps {
  position?: Position;
  curEntryPrice?: string | BN;
  nextEntryPrice?: string | BN;
  curPx?: string | BN;
  curSize: string | BN;
  curCollateral: string | BN;
  nextLever?: string | BN;
  curLiqPrice: string | BN;
  nextLiqPrice: string | BN;
}

const Details: FC<DetailsProps> = ({
  position,
  curEntryPrice,
  nextEntryPrice,
  nextLever,
  curLiqPrice,
  nextLiqPrice,
}) => {
  const hasPosition = !!position;

  return (
    <>
      <Leverage curLever={position?.leverage} nextLever={nextLever} />
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
      <Slippage />
    </>
  );
};

export default Details;
