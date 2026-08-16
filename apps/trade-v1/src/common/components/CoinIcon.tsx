import { ComponentProps, FC } from 'react';
import Image from 'next/image';
import { CoinIcon as BasicCoinIcon, cn } from '@repo/ui';

interface CoinIconProps extends ComponentProps<'div'> {
  src?: string;
  alt?: string;
  size?: number;
}

const CoinIcon: FC<CoinIconProps> = ({
  size = 36,
  src,
  alt,
  className,
  ...props
}) => {
  return src ? (
    <Image
      src={src}
      alt={alt || 'Icon'}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
    />
  ) : (
    <BasicCoinIcon size={size} className={className} {...props} />
  );
};

export default CoinIcon;
