'use client';

import { FC } from 'react';
import { HzIcon, HzTextIcon } from '@repo/ui';

const Logo: FC = () => {
  return (
    <div className="relative flex w-max items-center gap-1.5">
      <HzIcon className="text-accent" />
      <HzTextIcon size={12} className="text-black dark:text-white" />
    </div>
  );
};

export default Logo;
