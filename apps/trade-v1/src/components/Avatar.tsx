import { FC, memo } from 'react';
import BlockiesSvg from 'blockies-react-svg';

import { cn, Skeleton } from '@repo/ui';

import { useNameAndAvatar } from '@/hooks/useAccount';

interface AvatarProps {
  size?: number;
  className?: string;
}

const Avatar: FC<AvatarProps> = ({ size = 24, className }) => {
  const { data, isPending } = useNameAndAvatar();

  if (isPending) {
    return <Skeleton className={cn('h-6 w-6 rounded-full', className)} />;
  }

  if (data?.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={data.avatar}
        height={size}
        width={size}
        alt="avatar"
        className={cn('h-6 w-6 rounded-full', className)}
      />
    );
  }

  return (
    <BlockiesSvg
      size={size}
      address={data?.address || '0x'}
      className={cn('h-6 w-6 rounded-full', className)}
    />
  );
};

export default memo(Avatar);
