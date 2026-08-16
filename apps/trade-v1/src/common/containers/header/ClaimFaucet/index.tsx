import { FC } from 'react';
import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FaucetIcon,
  Loading,
} from '@repo/ui';
import { useWalletStore } from '../../../stores/walletStore';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[418px] w-full items-center justify-center">
      <Loading />
    </div>
  ),
});

const ClaimFaucet: FC<React.ComponentProps<typeof Button>> = ({
  size,
  className,
}) => {
  const { t } = useLingui();
  const network = useWalletStore((state) => state.network);

  if (network !== 'testnet') {
    return null;
  }

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size={size}
            className={cn(
              'max-md:!text-t-1100 max-md:!bg-bg-3-h5 gap-1.5 bg-black !px-4 text-white hover:bg-black/90 hover:text-white/90 max-md:size-[32px] max-md:!px-0 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:hover:text-black/90',
              className,
            )}
          >
            <FaucetIcon size={20} />
            <span className="max-md:hidden">{t`Claim Faucet`}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[440px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-t-1100">{t`Claim Faucet`}</DialogTitle>
          </DialogHeader>
          <Content />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClaimFaucet;
