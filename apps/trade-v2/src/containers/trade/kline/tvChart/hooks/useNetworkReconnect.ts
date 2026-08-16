import { EVENT_NAMES } from '@repo/lib/ws';

import { useWsListener } from '@/services/ws';

export const useNetworkReconnect = (refreshChart: () => void) => {
  useWsListener(EVENT_NAMES.RECONNECT, refreshChart);
};
