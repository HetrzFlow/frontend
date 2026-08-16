import React, { FC } from 'react';
import { UseFormReturn } from 'react-hook-form';
import FeeContent from '@/components/hzlp/FeeContent';
import { useFeeContentData } from '@/hooks/hzlp/useFeeContentData';
import { FormDataType } from '@/stores/hzlp/trade';
import Slippage from './Slippage';

interface FeeContentContainerProps {
  form: UseFormReturn<FormDataType>;
  handlePaySzChange: (value: { value: string; coin: string }) => void;
}

const FeeContentContainer: FC<FeeContentContainerProps> = ({
  form,
  handlePaySzChange,
}) => {
  const {
    paySz,
    receiveSz,
    pxUnit,
    isFetching,
    isReady,
    currentToken,
    bestToken,
    priceDifferencePercent,
    formattedPriceImpact,
    formattedLpFee,
    formattedPriceImpactUSD,
    formattedLpFeeUSD,
    refetch,
    handleSwitchToOptimalToken,
  } = useFeeContentData({ form, handlePaySzChange });

  return (
    <FeeContent
      paySzValue={paySz.value}
      paySzCoin={paySz.coin}
      receiveSzValue={receiveSz.value}
      receiveSzCoin={receiveSz.coin}
      pxUnit={pxUnit}
      isFetching={!!isFetching}
      isReady={isReady}
      formattedPriceImpact={formattedPriceImpact}
      formattedLpFee={formattedLpFee}
      formattedPriceImpactUSD={formattedPriceImpactUSD}
      formattedLpFeeUSD={formattedLpFeeUSD}
      showOptimalTokenSwitch={bestToken.symbol !== currentToken.symbol}
      priceDifferencePercent={priceDifferencePercent}
      bestTokenSymbol={bestToken.symbol}
      onRefetch={refetch}
      onSwitchToOptimalToken={handleSwitchToOptimalToken}
      slippageComponent={<Slippage type="text" />}
    />
  );
};

FeeContentContainer.displayName = 'FeeContentContainer';
export default FeeContentContainer;
