import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SOURCE_BSC_MAINNET } from '@hertzflow/sdk-v2/configs/chains';
import { getTradePayTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import { zeroAddress } from 'viem';
import { useShallow } from 'zustand/react/shallow';

import { CoinIcon } from '@repo/common/components';
import { ROUND_MODE } from '@repo/lib/calc';
import { CreditIcon, cn } from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  CREDIT_TOKEN_DISPLAY_DECIMALS,
  CREDIT_TOKEN_INPUT_DECIMALS,
  CREDIT_TOKEN_SYMBOL,
  getCreditAwareUsdPriceSymbol,
  TRADE_TYPE,
  useHzSdk,
  useInstStore,
} from '@/common';
import {
  COIN_SELECTOR_TRIGGER_CLASS_NAME,
  COIN_SELECTOR_TRIGGER_ICON_SIZE,
} from '@/common/components/CoinSelector';
import BasicCoinSzInput from '@/components/CoinSzInput';
import { formatSwapTokenAmount } from '@/components/Swap/format';
import CaretDownIcon from '@/components/Swap/icons/CaretDown';
import TokenSelector from '@/components/Swap/TokenSelector';
import {
  BNB_TOKEN,
  QUICK_SWAP_TOKENS,
  type SwapToken,
} from '@/components/Swap/useSwapTokens';
import { ENABLE_SWAP } from '@/constants/common';
import { useTradeGlobalStore } from '@/stores/trade/global';
import {
  DEFAULT_SWAP_SLIPPAGE,
  usePreferenceStore,
} from '@/stores/trade/preference';
import { useTradeStore, type PayToken } from '../../store';

interface CoinSzInputProps {
  label: React.ReactNode;
  coin: string;
  value: string;
  token?: PayToken;
  maxBalance?: string;
  className?: string;
  onChange: (value: { value: string; coin: string; token?: PayToken }) => void;
}

const canonicalAddress = (address?: string) => {
  if (!address) return '';
  return address.toLowerCase() === BNB_TOKEN.address.toLowerCase()
    ? zeroAddress
    : address.toLowerCase();
};

const toSwapToken = (
  token: PayToken,
  address: string,
  chainId?: number,
): SwapToken => ({
  chainId: chainId || 56,
  address:
    canonicalAddress(address) === zeroAddress ? BNB_TOKEN.address : address,
  name: token.name || token.symbol,
  symbol: token.symbol,
  decimals: token.decimals,
  logoURI: token.logoURI || '',
  price: token.price || '',
  balance: token.balance,
});

const toPayToken = (token: SwapToken): PayToken => ({
  name: token.name,
  symbol: token.symbol,
  decimals: token.decimals,
  decimal: token.decimals,
  logoURI: token.logoURI,
  price: token.price,
  balance: token.balance,
});

const TokenButton = ({
  token,
  onClick,
}: {
  token?: SwapToken;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={cn(
      COIN_SELECTOR_TRIGGER_CLASS_NAME,
      'w-fit max-w-[124px] shrink-0 gap-1 px-3',
      'enabled:hover:bg-bg-4 transition-[background-color,border-color] duration-200 enabled:hover:border-transparent',
    )}
    onClick={(event) => {
      event.preventDefault();
      onClick();
    }}
  >
    {token ? (
      <>
        <CoinIcon
          src={token.logoURI}
          alt={token.symbol}
          size={COIN_SELECTOR_TRIGGER_ICON_SIZE}
          className="shrink-0"
        />
        <span className="min-w-0 truncate">{token.symbol}</span>
      </>
    ) : (
      <span className="min-w-0 truncate">--</span>
    )}
    <CaretDownIcon className="shrink-0 text-white" />
  </button>
);

const CoinSzInput: FC<CoinSzInputProps> = ({
  label,
  value,
  coin,
  token,
  maxBalance,
  className,
  onChange,
}) => {
  const hzSdk = useHzSdk();
  const instId = useTradeGlobalStore((state) => state.instId);
  const [inst, coins] = useInstStore(
    useShallow((state) => [state.getInst(state, instId), state.getCoins()]),
  );
  const tradeType = useTradeStore((state) => state.tradeType);
  const setSwapSlippage = usePreferenceStore((state) => state.setSwapSlippage);
  const isLong = tradeType === TRADE_TYPE.long;

  const collateralCoinType = isLong
    ? inst?.longTokenAddress
    : inst?.shortTokenAddress;
  const defaultCoin = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress: collateralCoinType,
  });
  const defaultCoinObj = defaultCoin
    ? coins[defaultCoin] ||
      coins[defaultCoin.toLowerCase()] ||
      Object.values(coins).find(
        (item) => item.address?.toLowerCase() === defaultCoin.toLowerCase(),
      )
    : undefined;
  const defaultToken = useMemo(
    () =>
      defaultCoinObj
        ? toSwapToken(
            {
              name: defaultCoinObj.name,
              symbol: defaultCoinObj.symbol,
              decimals: defaultCoinObj.decimals,
              decimal: defaultCoinObj.decimal,
              logoURI: defaultCoinObj.icon,
            },
            defaultCoinObj.address,
            hzSdk?.chainId,
          )
        : undefined,
    [defaultCoinObj, hzSdk?.chainId],
  );
  const formToken = useMemo(
    () =>
      token && coin ? toSwapToken(token, coin, hzSdk?.chainId) : undefined,
    [coin, hzSdk?.chainId, token],
  );
  const [selectedToken, setSelectedToken] = useState<SwapToken | undefined>(
    formToken || defaultToken,
  );
  const [selectorOpen, setSelectorOpen] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const currentCoin = canonicalAddress(coin);
    if (formToken) {
      setSelectedToken(formToken);
      return;
    }
    if (defaultToken && currentCoin === canonicalAddress(defaultCoin)) {
      setSelectedToken(defaultToken);
      return;
    }
    if (defaultToken && defaultCoin) {
      setSelectedToken(defaultToken);
      onChangeRef.current({
        value,
        coin: defaultCoin,
        token: undefined,
      });
    }
  }, [coin, defaultCoin, defaultToken, formToken, value]);

  const handleValueChange = useCallback(
    ({ value: nextValue, coin: nextCoin }: { value: string; coin: string }) => {
      onChangeRef.current({
        value: nextValue,
        coin: nextCoin,
        token: selectedToken ? toPayToken(selectedToken) : undefined,
      });
    },
    [selectedToken],
  );

  const handleTokenSelect = useCallback(
    (nextToken: SwapToken) => {
      setSwapSlippage(DEFAULT_SWAP_SLIPPAGE);
      setSelectedToken(nextToken);
      onChangeRef.current({
        value,
        coin: canonicalAddress(nextToken.address),
        token: toPayToken(nextToken),
      });
    },
    [setSwapSlippage, value],
  );

  const isCreditMarket = inst?.category === CREDIT_MARKET_CATEGORY;
  const canSwap =
    ENABLE_SWAP && !isCreditMarket && hzSdk?.chainId === SOURCE_BSC_MAINNET;
  const isDefaultTokenSelected =
    !!defaultToken &&
    canonicalAddress(selectedToken?.address) ===
      canonicalAddress(defaultToken.address);

  useEffect(() => {
    if (canSwap || !defaultToken) return;

    const shouldReset =
      canonicalAddress(coin) !== canonicalAddress(defaultCoin) ||
      canonicalAddress(selectedToken?.address) !==
        canonicalAddress(defaultToken.address);
    if (!shouldReset) {
      setSelectedToken(defaultToken);
      return;
    }

    setSelectedToken(defaultToken);
    onChangeRef.current({
      value,
      coin: defaultCoin || '',
      token: undefined,
    });
  }, [canSwap, coin, defaultCoin, defaultToken, selectedToken?.address, value]);

  return (
    <>
      <BasicCoinSzInput
        isLong={isLong}
        percentActionSource="none"
        className={className}
        label={label}
        value={value}
        showBalance={true}
        coin={coin || defaultCoin || ''}
        balance={maxBalance ?? selectedToken?.balance}
        balanceDisplay={
          selectedToken?.balance != null
            ? formatSwapTokenAmount(selectedToken.balance, ROUND_MODE.DOWN)
            : undefined
        }
        balanceUnit={selectedToken?.symbol}
        decimal={
          isCreditMarket
            ? CREDIT_TOKEN_INPUT_DECIMALS
            : isDefaultTokenSelected
              ? defaultCoinObj?.szInputDecimal
              : selectedToken?.decimals
        }
        dispDecimal={
          isCreditMarket
            ? CREDIT_TOKEN_DISPLAY_DECIMALS
            : isDefaultTokenSelected
              ? defaultCoinObj?.szDispDecimal
              : selectedToken?.decimals
        }
        priceSymbol={
          isCreditMarket
            ? getCreditAwareUsdPriceSymbol({
                isCreditMarket,
                tokenSymbol: CREDIT_TOKEN_SYMBOL,
              })
            : undefined
        }
        px={selectedToken?.price || undefined}
        priceType="min"
        inputSuffix={
          isCreditMarket ? (
            <div className="bg-bg-7 flex h-9 cursor-not-allowed items-center gap-2 rounded-xl px-4 text-sm font-semibold">
              <CreditIcon size={24} className="text-accent" />
              {CREDIT_TOKEN_SYMBOL}
            </div>
          ) : canSwap ? (
            <TokenButton
              token={selectedToken}
              onClick={() => setSelectorOpen(true)}
            />
          ) : undefined
        }
        onChange={handleValueChange}
        disabledCoinSelector={!canSwap}
      />
      {canSwap ? (
        <TokenSelector
          open={selectorOpen}
          side="pay"
          selected={selectedToken}
          quickTokenPreset={QUICK_SWAP_TOKENS}
          onOpenChange={setSelectorOpen}
          onSelect={handleTokenSelect}
        />
      ) : null}
    </>
  );
};

export default CoinSzInput;
