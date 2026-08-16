import { SuiClient } from '@mysten/sui/client';
import { SuinsClient } from '@mysten/suins';

// all balances
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

// query suiName
export const fetchSuiNameAndAvatar = async ({
  suiClient,
  suinsClient,
  address,
}: {
  suiClient: SuiClient;
  suinsClient: SuinsClient;
  address: string;
}): Promise<{
  name: string;
  avatar: string;
  nftId: string;
  address: string;
}> => {
  const result = {
    name: '',
    avatar: '',
    nftId: '',
    address,
  };
  try {
    const { data: suiNames } = await suiClient.resolveNameServiceNames({
      address,
    });
    const suiName = suiNames[0];

    if (!suiName) {
      return result;
    }

    const nameRecord = await suinsClient.getNameRecord(suiName);
    if (!nameRecord) {
      return result;
    }
    const { nftId, avatar } = nameRecord;
    result.nftId = nftId;

    if (avatar) {
      const { data } = await suiClient.getObject({
        id: avatar,
        options: {
          showDisplay: true,
        },
      });

      result.avatar = data?.display?.data?.image_url || '';
    }

    return result;
  } catch {
    return result;
  }
};
