import { FC } from 'react';
import { cn } from '@repo/ui';

import InfoBar from './InfoBar';

const Footer: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'mx-auto max-w-[1440px] px-20 pb-10 max-md:max-w-dvw max-md:px-4 max-md:pb-5 lg:overflow-x-visible',
        className,
      )}
    >
      <InfoBar />
    </div>
  );
};

export default Footer;
