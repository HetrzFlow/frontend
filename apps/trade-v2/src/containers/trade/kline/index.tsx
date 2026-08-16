import { FC } from 'react';

import dynamic from 'next/dynamic';
import { KlineLoading } from '@/layouts/trade/LoadingShell';

const TvChart = dynamic(() => import('./tvChart'), {
  ssr: false,
  loading: () => <KlineLoading />,
});

const Kline: FC = () => {
  return <TvChart />;
};

export default Kline;
