'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { Button, cn, DialogFooter, Loading, Separator } from '@repo/ui';
import { useBalances, useCurrentAccountAddress } from '@/common/chainClient';
import ConnectBtn from '@/common/components/ConnectBtn';
import { useClaimUSDT } from '@/common/hooks/useClaimUSDT';
import { useInstStore } from '@/common/stores';

const MIN_TESTNET_BALANCE = '0.01';
const CLAIM_COOLDOWN_SECONDS = 24 * 60 * 60;
const CLAIM_STORAGE_KEY_PREFIX = 'trade-v2.faucet.lastClaimAt';

const Content: FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { t } = useLingui();
  const currentAccount = useCurrentAccountAddress();
  const usdtCoin = useInstStore((state) => state.getUsdtCoin(state));
  const coinsMap = useInstStore((state) => state.getCoins());
  const balances = useBalances();
  const { mutateAsync: claimUSDT, isPending } = useClaimUSDT();
  const faucetCoins = useMemo(() => {
    if (!usdtCoin) return [];
    return [usdtCoin];
  }, [usdtCoin]);

  const isClaimPending = isPending;
  const bnbCoin = useMemo(() => {
    const coins = Object.values(coinsMap ?? {});
    return coins.find((coin) => coin.isNative) ?? coinsMap?.['BNB'];
  }, [coinsMap]);
  const bnbBalanceItem = useMemo(() => {
    if (!balances.length) return undefined;
    if (bnbCoin?.address) {
      return balances.find((v) => v.address === bnbCoin.address);
    }
    return balances.find((v) => v.symbol === (bnbCoin?.symbol ?? 'BNB'));
  }, [balances, bnbCoin?.address, bnbCoin?.symbol]);
  const bnbBalance = useMemo(() => {
    const decimals =
      bnbCoin?.decimals ??
      (bnbBalanceItem?.decimals ? Number(bnbBalanceItem.decimals) : 18);
    return calc(bnbBalanceItem?.totalBalance ?? 0).div(Math.pow(10, decimals));
  }, [
    bnbBalanceItem?.totalBalance,
    bnbBalanceItem?.decimals,
    bnbCoin?.decimals,
  ]);
  const hasMinBnb = useMemo(
    () => bnbBalance.gte(MIN_TESTNET_BALANCE),
    [bnbBalance],
  );
  const isBalanceReady = useMemo(() => {
    if (!currentAccount) return true;
    return balances.length > 0;
  }, [balances.length, currentAccount]);
  const isEligible = isBalanceReady ? hasMinBnb : false;
  const formatCountdown = useCallback((seconds: number): string => {
    if (seconds <= 0) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  const getStoredNextClaimTime = useCallback(() => {
    if (typeof window === 'undefined' || !currentAccount) return null;
    const stored = window.localStorage.getItem(
      `${CLAIM_STORAGE_KEY_PREFIX}.${currentAccount}`,
    );
    if (!stored) return null;
    const lastClaimAt = Number(stored);
    if (!Number.isFinite(lastClaimAt) || lastClaimAt <= 0) return null;
    return lastClaimAt + CLAIM_COOLDOWN_SECONDS;
  }, [currentAccount]);

  const [nextClaimTime, setNextClaimTime] = useState<number | null>(() =>
    getStoredNextClaimTime(),
  );
  const [countdown, setCountdown] = useState(() => {
    const initialNextClaimTime = getStoredNextClaimTime();
    if (!initialNextClaimTime) return '00:00:00';
    const now = Date.now() / 1000;
    const timeLeft = initialNextClaimTime - now;
    return timeLeft > 0 ? formatCountdown(timeLeft) : '00:00:00';
  });
  const countdownText = countdown;
  useEffect(() => {
    if (!currentAccount) {
      setNextClaimTime(null);
      return;
    }
    const storedNextClaimTime = getStoredNextClaimTime();
    setNextClaimTime(storedNextClaimTime);
  }, [currentAccount, getStoredNextClaimTime]);

  useEffect(() => {
    if (!nextClaimTime) {
      setCountdown('00:00:00');
      return;
    }

    const updateCountdown = () => {
      const now = Date.now() / 1000;
      const timeLeft = nextClaimTime - now;

      if (timeLeft <= 0) {
        setCountdown('00:00:00');
        return;
      }

      setCountdown(formatCountdown(timeLeft));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [formatCountdown, nextClaimTime]);

  const isCoolingDown = !!nextClaimTime && countdownText !== '00:00:00';
  const canClaim = isBalanceReady && isEligible && !isCoolingDown;
  const hasInsufficientGas = !!currentAccount && isBalanceReady && !isEligible;
  const addressText =
    currentAccount || t`Connect your wallet to receive test funds`;

  const handleClaim = async () => {
    try {
      const result = await claimUSDT();
      if (result?.success) {
        const now = Date.now() / 1000;
        setNextClaimTime(now + CLAIM_COOLDOWN_SECONDS);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            `${CLAIM_STORAGE_KEY_PREFIX}.${currentAccount ?? ''}`,
            String(now),
          );
        }
        if (onClose) {
          setTimeout(() => onClose(), 500);
        }
      }
    } catch {
      // TODO: handle claim failure if needed
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-t-270 text-sm">{t`Receiving Wallet Address`}</h3>
        <div className="bg-bg-4 border-border flex h-8 w-full items-center rounded-xl border px-2.5">
          <p
            className={cn(
              'text-t-1100 min-w-0 flex-1 truncate text-xs leading-normal font-medium',
              !currentAccount && 'text-t-430',
            )}
            title={addressText}
          >
            {addressText}
          </p>
        </div>
        <div className="flex items-start justify-between gap-2 text-sm">
          <p
            className={cn(
              'text-t-350 min-w-0',
              hasInsufficientGas && 'text-destructive',
            )}
          >
            {t`Require > ${MIN_TESTNET_BALANCE} testnet BNB for gas.`}
          </p>
          <a
            className="text-accent shrink-0 underline"
            href="https://www.bnbchain.org/en/testnet-faucet"
            target="_blank"
            rel="noreferrer"
          >
            {t`Get testnet BNB`}
          </a>
        </div>
        <p className="text-t-350 text-sm">{t`Reset every 24 hours`}</p>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <h3 className="text-t-270 text-xs">{t`You'll receive`}</h3>
        {faucetCoins.map((coin) => {
          const coinAmount = '100';
          return (
            <div
              key={coin.symbol}
              className="flex items-center justify-between"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <CoinIcon
                  src={coin.icon}
                  alt={`${coin.symbol} icon`}
                  size={24}
                />
                <h3 className="text-sm font-medium">{coin.symbol}</h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="font-plex text-right text-sm font-medium">
                  {coinAmount}
                </p>
                <p className="text-t-350 text-right text-xs">{t`Test only`}</p>
              </div>
            </div>
          );
        })}
      </div>
      <DialogFooter className="w-full">
        {currentAccount ? (
          <Button
            className="font-borna bg-accent hover:bg-accent text-accent-foreground hover:text-accent-foreground disabled:bg-bg-4 disabled:hover:bg-bg-4 mx-auto h-8 w-full rounded-xl px-4 text-xs font-medium"
            onClick={() => {
              if (currentAccount && canClaim) {
                handleClaim();
              }
            }}
            disabled={
              isClaimPending ||
              hasInsufficientGas ||
              (!!currentAccount && isCoolingDown)
            }
          >
            {isClaimPending ? (
              <Loading className="h-5 w-5" />
            ) : currentAccount && isBalanceReady && !isEligible ? (
              t`Insufficient balance`
            ) : isCoolingDown ? (
              t`Claimable in ${countdownText}`
            ) : (
              t`Get Test Funds`
            )}
          </Button>
        ) : (
          <ConnectBtn
            className="font-borna mx-auto h-8 w-full rounded-xl px-4 text-xs font-medium"
            loadingClassName="mx-auto h-8 w-full"
          >
            {t`Connect Wallet to Claim`}
          </ConnectBtn>
        )}
      </DialogFooter>
    </div>
  );
};

export default Content;
