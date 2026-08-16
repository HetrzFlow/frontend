import { useQuery } from '@repo/lib/queryClient';
import { get } from '@repo/lib/rest';
import { toast } from '@repo/ui';
import { useCurrentAccountAddress } from '@/common/chainClient';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { toLowerAddressParam } from '@/lib/address';

interface PnlSummaryRes {
  error?: string;
  data: {
    realized_pnl: {
      pools: string;
      positions: string;
      total: string;
      vaults: string;
    };
    unrealized_pnl: {
      pools: string;
      total: string;
      vaults: string;
    };
    total_bought: {
      pools: string;
      positions: string;
      total: string;
      vaults: string;
    };
    cost_basis: {
      pools: string;
      vaults: string;
      total: string;
    };
    profit_sharing: {
      pools: string;
      positions: string;
      total: string;
      vaults: string;
    };
    loss_rebate: {
      pools: string;
      positions: string;
      total: string;
      vaults: string;
    };
  };
}

// get account pnl summary
export const usePnlSummary = () => {
  const accountAddress = useCurrentAccountAddress();
  const accountAddressParam = toLowerAddressParam(accountAddress);

  return useQuery({
    queryKey: ['rest', 'account', 'pnlSummary', accountAddressParam],
    enabled: !!accountAddress,
    queryFn: async () => {
      const { error, data } = await get<PnlSummaryRes>(
        `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/user/pnl-summary`,
        {
          account: toLowerAddressParam(accountAddress),
        },
      );

      if (error) {
        toast.error(error, { id: 'rest-account-pnlSummary' });
        throw new Error(error);
      }

      return data;
    },
    refetchInterval: 10_000,
  });
};
