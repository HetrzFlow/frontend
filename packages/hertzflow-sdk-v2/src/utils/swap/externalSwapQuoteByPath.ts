import { ExternalSwapPath, ExternalSwapQuote, ExternalSwapQuoteParams } from "types/trade";

import { TokenPrices } from "types/tokens";

export const getExternalSwapQuoteByPath = ({
  amountIn,
  tokenInPrices,
  externalSwapPath,
  externalSwapQuoteParams,
}: {
  tokenInPrices: TokenPrices;
  amountIn: bigint;
  externalSwapPath: ExternalSwapPath;
  externalSwapQuoteParams: ExternalSwapQuoteParams;
}): ExternalSwapQuote | undefined => {
  if (
    amountIn === undefined ||
    externalSwapQuoteParams.gasPrice === undefined ||
    externalSwapQuoteParams.tokensData === undefined ||
    externalSwapQuoteParams.receiverAddress === undefined
  ) {
    return undefined;
  }

  return undefined;
};
