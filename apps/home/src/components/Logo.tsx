import { FC } from 'react';
import { cn, HzIcon, HzTextIcon } from '@repo/ui';

interface LogoProps {
  className?: string;
}

const Logo: FC<LogoProps> = ({ className }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <HzIcon className="text-accent" size={32} />
      <HzTextIcon className="text-t-1100" size={16} />
    </div>
  );
};

export default Logo;
