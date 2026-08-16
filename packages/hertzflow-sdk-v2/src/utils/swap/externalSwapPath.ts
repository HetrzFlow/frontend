import { ExternalSwapPath } from "types/trade";

export const getAvailableExternalSwapPaths = ({
  chainId,
  fromTokenAddress,
}: {
  chainId: number;
  fromTokenAddress: string;
}): ExternalSwapPath[] => {
  return [];
};
