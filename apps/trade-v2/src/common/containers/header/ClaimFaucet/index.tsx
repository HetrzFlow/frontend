'use client';

import { FC, useEffect, useState } from 'react';
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
  InfoCircleIcon,
  Loading,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { useWalletStore } from '@/common/stores/walletStore';
import { scheduleIdleTask } from '@/lib/runtime/scheduleIdleTask';

const Content = dynamic(
  () =>
    import('@/common/containers/header/ClaimFaucet/Content').then(
      (mod) => mod.default,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[244px] w-full items-center justify-center">
        <Loading />
      </div>
    ),
  },
);

const ClaimFaucetInfoTip: FC<{
  content: string;
  label: string;
  title: string;
}> = ({ content, label, title }) => {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={label}
            className="text-t-350 hover:text-t-1100 flex size-[14px] items-center justify-center max-md:hidden"
          >
            <InfoCircleIcon size={14} />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={0}
          className="w-80 rounded-2xl p-3 text-xs"
        >
          {content}
        </TooltipContent>
      </Tooltip>
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="text-t-350 hover:text-t-1100 flex size-[14px] items-center justify-center md:hidden"
          >
            <InfoCircleIcon size={14} />
          </button>
        </DialogTrigger>
        <DialogContent
          position="bottom"
          className="bg-bg-3 gap-3 p-3"
          aria-describedby={undefined}
        >
          <DialogTitle className="font-borna text-base font-medium">
            {title}
          </DialogTitle>
          <p className="text-t-270 text-xs">{content}</p>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ClaimFaucet: FC<React.ComponentProps<typeof Button>> = ({
  size,
  className,
}) => {
  const { t } = useLingui();
  const network = useWalletStore((state) => state.network);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (network !== 'testnet') return;

    return scheduleIdleTask(() => {
      void import('@/common/containers/header/ClaimFaucet/Content');
    });
  }, [network]);

  if (network !== 'testnet') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={size}
          className={cn(
            'max-md:!text-t-1100 bg-bg-3 text-t-1100 hover:bg-bg-4 hover:text-t-1100 gap-1.5 !px-4 max-md:size-[32px] max-md:!px-0',
            className,
          )}
        >
          <FaucetIcon size={20} />
          <span className="text-xs max-md:hidden">{t`Get Test Funds`}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="bg-bg-3 min-h-[308px] w-[440px] gap-4 rounded-2xl p-3 data-[state=open]:[--tw-enter-scale:1] md:data-[state=open]:[--tw-enter-scale:1]"
        closeClassName="top-3 right-3 text-t-1100"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex-row items-center gap-2 pr-8">
          <DialogTitle className="font-borna text-base/tight font-medium">
            {t`Get Test Funds`}
          </DialogTitle>
          <ClaimFaucetInfoTip
            title={t`Get Test Funds`}
            label={t`Get Test Funds info`}
            content={t`Free test tokens for the HertzFlow testnet, no real value. Use them to trade risk-free!`}
          />
        </DialogHeader>
        <Content onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default ClaimFaucet;
