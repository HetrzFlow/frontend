import { FC } from 'react';
import Image from 'next/image';
import { cn } from '@repo/ui';

interface ItemProps {
  className?: string;
  src: string;
  alt: string;
}

const Item: FC<ItemProps> = ({ className, src, alt }) => {
  return (
    <div
      className={cn(
        'flex size-20 shrink-0 grow-0 items-center justify-center gap-3 rounded-lg border bg-black p-4 group-hover/self:border-[#2E2E2E]',
        className,
      )}
    >
      <Image src={src} height={40} width={40} alt={alt} />
    </div>
  );
};

export default Item;
