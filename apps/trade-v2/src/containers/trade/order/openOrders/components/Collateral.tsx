import { FC } from 'react';

import { useInstStore } from '@/common';
import CommonCollateral from '../../components/Collateral';

interface CollateralProps {
  marketAddress: string;
  triggerPrice?: string;
  collateralAmount: string;
  collateralTokenAddress: string;
}

const Collateral: FC<CollateralProps> = ({
  marketAddress,
  triggerPrice,
  collateralAmount,
  collateralTokenAddress,
}) => {
  const inst = useInstStore((state) => state.getInsts()[marketAddress]);

  return (
    <CommonCollateral
      price={
        inst?.indexTokenAddress === collateralTokenAddress
          ? triggerPrice
          : undefined
      }
      collateralAmount={collateralAmount}
      collateralTokenAddress={collateralTokenAddress}
    />
  );
};

export default Collateral;
