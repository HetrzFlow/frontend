import { FC, memo } from 'react';

import { useCurrentWallet } from '@mysten/dapp-kit';
import { cn, Skeleton } from '@repo/ui';

interface AvatarProps {
  size?: number;
  className?: string;
}

const Avatar: FC<AvatarProps> = ({ size = 24, className }) => {
  const { currentWallet, isConnected } = useCurrentWallet();

  if (!isConnected) {
    return (
      <Skeleton
        style={{
          height: size,
          width: size,
        }}
        className={cn('rounded-full', className)}
      />
    );
  }

  return (
    <img
      src={currentWallet?.icon}
      height={size}
      width={size}
      alt="avatar"
      className={cn('rounded-full', className)}
    />
  );
};

export default memo(Avatar);
