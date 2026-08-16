import { SuiClient } from '@mysten/sui/client';

export const getAllBalances = async (
  suiClient: SuiClient,
  address: string,
): Promise<{ coinId: string; amount: number | string }[]> => {
  return suiClient
    .getAllBalances({
      owner: address,
    })
    .then((balances) => {
      return balances.map((balance) => {
        return {
          coinId: balance.coinType,
          amount: balance.totalBalance,
        };
      });
    });
};
