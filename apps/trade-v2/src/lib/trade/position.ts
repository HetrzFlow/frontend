import type { Position } from '@/common/services';

export const getPositionModeKey = ({
  marketAddress,
  isLong,
  isZFP = false,
}: {
  marketAddress: string;
  isLong: boolean;
  isZFP?: boolean;
}) => `${marketAddress}_${isLong}_${isZFP}`;

export const findPositionByMode = ({
  positions,
  marketAddress,
  isLong,
  isZFP,
}: {
  positions: Position[];
  marketAddress: string;
  isLong: boolean;
  isZFP?: boolean;
}) =>
  positions.find(
    (position) =>
      position.marketAddress === marketAddress &&
      position.isLong === isLong &&
      (isZFP === undefined || position.isZFP === isZFP),
  );
