import { createElement } from 'react';
import dynamic from 'next/dynamic';
import RoutePageLoading from '@/common/components/RoutePageLoading';

export const PoolsLayout = dynamic(
  () =>
    import('../../containers/pools/PoolsOverview').then(
      (mod) => mod.PoolsOverview,
    ),
  {
    loading: () => createElement(RoutePageLoading, { variant: 'pools' }),
  },
);
