'use client';

import { ComponentProps, FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { CoinIcon as BasicCoinIcon, cn, CreditIcon } from '@repo/ui';

interface CoinIconProps extends ComponentProps<'div'> {
  src?: string;
  alt?: string;
  size?: number;
  onImageError?: () => void;
}

const CoinIcon: FC<CoinIconProps> = ({
  size = 36,
  src,
  alt,
  className,
  onImageError,
  ...props
}) => {
  // Decision rationale: Avoid hydration mismatch by matching SSR and initial client render
  const [mounted, setMounted] = useState(false);
  const [failedSrc, setFailedSrc] = useState('');
  useEffect(() => {
    setMounted(true);
  }, []);

  return src === 'Credit' ? (
    <CreditIcon
      size={size}
      className={cn('text-accent', className)}
      {...(props as ComponentProps<'svg'>)}
    />
  ) : mounted && !!src && failedSrc !== src ? (
    <Image
      src={src}
      alt={alt || 'Icon'}
      width={size}
      height={size}
      unoptimized
      referrerPolicy="no-referrer"
      style={{ width: size, height: size }}
      className={cn('rounded-full object-cover', className)}
      onError={() => {
        setFailedSrc(src);
        onImageError?.();
      }}
    />
  ) : (
    <BasicCoinIcon size={size} className={className} {...props} />
  );
};

export default CoinIcon;
