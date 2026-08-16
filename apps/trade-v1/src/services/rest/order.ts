import { useQuery } from '@repo/lib/queryClient';
import type { Order } from '@/common';

// import { get } from '@repo/lib/rest';

// get related orders by position
export const usePositionOrders = (positionId?: string) => {
  return useQuery({
    queryKey: ['rest', 'positionOrders', positionId],
    initialData: [],
    enabled: !!positionId,
    queryFn: () => {
      // return get(`${API_BASE_URL}/xxx`)
      return Promise.resolve([
        // {
        //   id: '1',
        //   instId: 'BTC/USD',
        //   triggerPrice: '90000',
        //   size: '500',
        //   posSide: 'long',
        //   side: 'sell',
        //   lever: '20',
        //   orderTime: 1749549470305,
        //   triggerType: ORDER_TRIGGER_TYPE.down,
        // },
        // {
        //   id: '2',
        //   instId: 'BTC/USD',
        //   triggerPrice: '120000',
        //   size: '600',
        //   posSide: 'long',
        //   side: 'sell',
        //   lever: '20',
        //   orderTime: 1709549470305,
        //   triggerType: ORDER_TRIGGER_TYPE.up,
        // },
      ] as Order[]);
    },
  });
};
