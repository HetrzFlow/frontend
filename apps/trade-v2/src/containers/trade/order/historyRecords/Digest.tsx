import { FC } from 'react';

import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { ArrowUpRightIcon, cn } from '@repo/ui';
import { useHzSdk } from '@/common';

interface DigestProps {
  digest: string;
  className?: string;
}

const Digest: FC<DigestProps> = ({ digest, className }) => {
  const hzSdk = useHzSdk();
  const explorerHost = hzSdk
    ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
    : '';
  return (
    <a
      href={`${explorerHost}/tx/${digest}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      {`${digest.slice(0, 4)}...${digest.slice(-4)}`}
      {/* to explorer */}
      <span className="text-t-430 hover:text-t-1100">
        <ArrowUpRightIcon size={16} />
      </span>
    </a>
  );
};

export default Digest;
