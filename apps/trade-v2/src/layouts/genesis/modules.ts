import dynamic from 'next/dynamic';

export const GenesisLayout = dynamic(() =>
  import('../../containers/genesis/GenesisPage.client').then(
    (mod) => mod.GenesisPageClient,
  ),
);
