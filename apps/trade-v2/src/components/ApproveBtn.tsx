import { FC, ReactNode } from 'react';
import { useLingui } from '@lingui/react/macro';
import { type Address } from 'viem';
import { calc } from '@repo/lib/calc';
import { Button, cn, LoaderCircleIcon } from '@repo/ui';
import { useApproveTokenForSyntheticsRouter, useIsConnect } from '@/common';

interface ApproveBtnProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals?: number;
  tokenAmount: string;
  children?: ReactNode;
  className?: string;
  skipApprove?: boolean;
}

const ApproveBtn: FC<ApproveBtnProps> = ({
  tokenAddress,
  tokenSymbol,
  tokenDecimals,
  tokenAmount,
  children,
  className,
  skipApprove,
}) => {
  const { t } = useLingui();
  const isConnected = useIsConnect();
  const {
    allowanceAmount = 0,
    approveToken,
    isApproving,
  } = useApproveTokenForSyntheticsRouter({
    tokenAddress: tokenAddress as Address,
    tokenDecimals,
  });

  const needApprove = calc(allowanceAmount).lt(tokenAmount);

  if (!isConnected || skipApprove || !needApprove) {
    return children;
  }

  return (
    <Button
      onClick={(event) => {
        event.preventDefault();
        void approveToken(undefined).catch(() => undefined);
      }}
      className={cn(
        'bg-accent hover:bg-accent/70 text-accent-foreground hover:text-accent-foreground/70',
        className,
      )}
      disabled={isApproving}
    >
      {isApproving ? (
        <>
          <LoaderCircleIcon size={16} className="animate-spin" />
          {t`Approve ${tokenSymbol} Spending`}
        </>
      ) : (
        t`Approve ${tokenSymbol}`
      )}
    </Button>
  );
};

export default ApproveBtn;
