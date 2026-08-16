import { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trans } from '@lingui/react/macro';
import { useNavItems } from '@repo/common/hooks';
import { Button, SkeletonLayout } from '@repo/ui';

interface ActionBtnProps {
  marketAddress?: string;
}

const ActionBtn: FC<ActionBtnProps> = ({ marketAddress }) => {
  const isLoading = marketAddress === undefined;
  const { prefetch } = useRouter();
  const { pools } = useNavItems();
  const href = `${pools.link}/${marketAddress}`;
  return (
    <SkeletonLayout
      isLoading={isLoading}
      className="ml-auto h-[24.4px] w-16 rounded-xl"
    >
      <Link
        href={href}
        className="text-accent"
        prefetch={false}
        onMouseEnter={() => prefetch(href)}
        onPointerDown={() => prefetch(href)}
      >
        <Button variant="accent" size="sm" className="h-6">
          <Trans>Manage</Trans>
        </Button>
      </Link>
    </SkeletonLayout>
  );
};

export default ActionBtn;
