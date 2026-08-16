import { createElement } from 'react';
import dynamic from 'next/dynamic';
import RoutePageLoading from '@/common/components/RoutePageLoading';

export const VaultsLayout = dynamic(
  () =>
    import('../../containers/vaults/VaultsOverview').then(
      (mod) => mod.VaultsOverview,
    ),
  {
    loading: () => createElement(RoutePageLoading, { variant: 'vaults' }),
  },
);
