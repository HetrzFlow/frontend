'use client';

import Image from 'next/image';

import { useLingui } from '@lingui/react/macro';

import { CoinIcon } from '@repo/common/components';
import { ExclamationCircleIcon } from '@repo/ui';

import { swapMessages, translateSwapMessage } from './messages';
import {
  getSwapTransactionUrl,
  type SwapTransactionToastData,
  type SwapTransactionToastToken,
} from './swapTransactionToastModel';

const ASSET_ROOT = '/trade-static/swap/transaction-toast';

const SwapIcon = () => (
  <span className="flex size-4 shrink-0 items-center justify-center">
    <Image
      src={`${ASSET_ROOT}/swap.svg`}
      alt=""
      width={11.219}
      height={13.886}
      unoptimized
    />
  </span>
);

const ProgressIcon = ({ active }: { active: boolean }) => (
  <span className="relative size-6 shrink-0" aria-hidden>
    <Image
      src={`${ASSET_ROOT}/pending-muted.svg`}
      alt=""
      width={24}
      height={24}
      unoptimized
    />
    {active ? (
      <Image
        src={`${ASSET_ROOT}/pending-active.svg`}
        alt=""
        width={24}
        height={24}
        unoptimized
        className="swap-toast-progress absolute inset-0"
      />
    ) : null}
  </span>
);

const CompletedIcon = () => (
  <span className="flex size-6 shrink-0 items-center justify-center">
    <Image
      src={`${ASSET_ROOT}/success-muted.svg`}
      alt=""
      width={20}
      height={20}
      unoptimized
    />
  </span>
);

const ErrorIcon = () => (
  <ExclamationCircleIcon
    size={20}
    className="text-destructive shrink-0"
    aria-hidden
  />
);

const TransactionLink = ({
  href,
  active,
  label,
}: {
  href?: string;
  active: boolean;
  label: string;
}) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex size-4 shrink-0 items-center justify-center"
    >
      <Image
        src={`${ASSET_ROOT}/external-${active ? 'active' : 'muted'}.svg`}
        alt=""
        width={8.684}
        height={8.679}
        unoptimized
        className="rotate-180"
      />
    </a>
  ) : null;

const Divider = () => (
  <Image
    src={`${ASSET_ROOT}/divider.svg`}
    alt=""
    width={347}
    height={1}
    unoptimized
    className="h-auto w-full"
  />
);

const TokenAmount = ({
  token,
  amount,
  align = 'left',
}: {
  token: SwapTransactionToastToken;
  amount: string;
  align?: 'left' | 'right';
}) => (
  <span
    className={`flex min-w-0 flex-1 items-center gap-1.5 ${
      align === 'right' ? 'justify-end' : ''
    }`}
  >
    <CoinIcon src={token.logoURI} alt="" size={20} className="shrink-0" />
    <span className="truncate text-sm leading-[1.2] font-medium">
      {amount} {token.symbol}
    </span>
  </span>
);

export const SwapTransactionToast = ({
  stage,
  payToken,
  receiveToken,
  payAmount,
  receiveAmount,
  explorerHost,
  submittedHash,
  confirmedHash,
  errorMessage,
}: SwapTransactionToastData) => {
  const { i18n, t } = useLingui();
  const isError = stage === 'error';
  const usesSubmittingHeader =
    stage === 'submitting' || (isError && !submittedHash);
  const submittedUrl = getSwapTransactionUrl(explorerHost, submittedHash);
  const confirmedUrl = getSwapTransactionUrl(explorerHost, confirmedHash);
  const summary = translateSwapMessage(
    i18n,
    swapMessages.swapTransactionSummary,
    {
      payAmount,
      payToken: payToken.symbol,
      receiveAmount,
      receiveToken: receiveToken.symbol,
    },
  );
  const swapping = translateSwapMessage(i18n, swapMessages.swappingTokens, {
    payToken: payToken.symbol,
    receiveToken: receiveToken.symbol,
  });
  const linkLabel = i18n._(swapMessages.viewTransaction);
  const submittedLinkLabel = `${linkLabel}: ${i18n._(
    swapMessages.orderRequestSent,
  )}`;
  const confirmedLinkLabel = `${linkLabel}: ${swapping}`;

  return (
    <div className="font-borna text-t-1100 flex w-[347px] max-w-[calc(94vw-32px)] flex-col gap-2">
      <div className="flex min-h-6 items-center justify-between gap-2">
        {usesSubmittingHeader ? (
          <span className="flex items-center gap-2 text-sm leading-[1.2] font-medium">
            <SwapIcon />
            {t`Swap`}
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-2 text-sm leading-[1.2] font-medium">
            <SwapIcon />
            <span className="truncate">{summary}</span>
          </span>
        )}
        {stage === 'submitting' ? (
          <span className="text-t-270 flex shrink-0 items-center gap-1 text-sm leading-[1.2] font-normal">
            {t`Submitting`}
            <ProgressIcon active />
          </span>
        ) : isError ? (
          <ErrorIcon />
        ) : null}
      </div>
      <Divider />
      {isError ? (
        <p
          role="alert"
          className="text-t-270 min-h-6 text-sm leading-[1.2] font-normal"
        >
          {errorMessage}
        </p>
      ) : usesSubmittingHeader ? (
        <>
          <div className="text-t-270 text-[13px] leading-[1.2] font-normal">
            {payToken.symbol} → {receiveToken.symbol}
          </div>
          <div className="flex min-h-6 items-center justify-between">
            <TokenAmount token={payToken} amount={payAmount} />
            <span className="flex size-6 shrink-0 items-center justify-center">
              <Image
                src={`${ASSET_ROOT}/flow-arrow.svg`}
                alt=""
                width={10}
                height={10}
                unoptimized
              />
            </span>
            <TokenAmount
              token={receiveToken}
              amount={receiveAmount}
              align="right"
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex min-h-6 items-center justify-between">
            <span
              className={`flex min-w-0 items-center gap-1 text-sm leading-[1.2] font-normal ${
                stage === 'confirmed' ? 'text-t-350' : 'text-accent'
              }`}
            >
              {stage === 'confirmed' ? (
                <CompletedIcon />
              ) : (
                <ProgressIcon active />
              )}
              <span className="truncate">
                {i18n._(swapMessages.orderRequestSent)}
              </span>
            </span>
            <TransactionLink
              href={submittedUrl}
              active={stage === 'submitted'}
              label={submittedLinkLabel}
            />
          </div>
          <div className="flex min-h-6 items-center justify-between">
            <span
              className={`flex min-w-0 items-center gap-1 text-sm leading-[1.2] font-normal ${
                stage === 'confirmed' ? 'text-accent' : 'text-t-270'
              }`}
            >
              <ProgressIcon active={stage === 'confirmed'} />
              <span className="truncate">{swapping}</span>
            </span>
            {stage === 'confirmed' ? (
              <TransactionLink
                href={confirmedUrl}
                active
                label={confirmedLinkLabel}
              />
            ) : null}
          </div>
        </>
      )}
      <style>{`
        @property --swap-toast-progress {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }

        @keyframes swap-toast-progress {
          to {
            --swap-toast-progress: 360deg;
          }
        }

        .swap-toast-progress {
          --swap-toast-progress: 0deg;
          -webkit-mask-image: conic-gradient(
            from -90deg,
            #000 var(--swap-toast-progress),
            transparent 0
          );
          mask-image: conic-gradient(
            from -90deg,
            #000 var(--swap-toast-progress),
            transparent 0
          );
          animation: swap-toast-progress 1s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .swap-toast-progress {
            --swap-toast-progress: 360deg;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};
