'use client';

import dynamic from 'next/dynamic';

import BlockBadgeLoadingShell from './BlockBadgeLoadingShell';

const BlockBadge = dynamic(
  () => import('./BlockBadge.client').then((module) => module.BlockBadge),
  {
    ssr: false,
    loading: BlockBadgeLoadingShell,
  },
);

export default BlockBadge;
