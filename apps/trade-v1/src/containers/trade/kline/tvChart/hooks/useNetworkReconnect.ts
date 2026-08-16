import { useEffect } from 'react';
import { EVENT_NAMES } from '@repo/lib/ws';

import { addWsListener } from '@/services/ws';

// ws reconnect, reset kline chart
export const useNetworkReconnect = (refreshChart: () => void) => {
  useEffect(() => {
    // when reconnect，reset data
    const removeWsListener = addWsListener(EVENT_NAMES.RECONNECT, () => {
      refreshChart();
    });

    return () => {
      removeWsListener();
    };
  }, [refreshChart]);
};
