'use client';

import { FC } from 'react';
import { HzIcon, HzTextIcon } from '@repo/ui';

const Logo: FC = () => {
  return (
    <div className="flex items-center gap-1 px-2">
      <HzIcon size={20} />
      <HzTextIcon size={10} />
    </div>
  );
};

export default Logo;
