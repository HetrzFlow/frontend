'use client';

import { memo } from 'react';
import { useUnifiedActivityTimeline } from './useUnifiedActivity';

function ActivityPrefetch() {
  useUnifiedActivityTimeline();
  return null;
}

export default memo(ActivityPrefetch);
