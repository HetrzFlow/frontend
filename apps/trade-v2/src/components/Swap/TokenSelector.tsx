'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Image from 'next/image';

import { useLingui } from '@lingui/react/macro';

import { CoinIcon } from '@repo/common/components';
import { useQuery, useQueryClient } from '@repo/lib/queryClient';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Loading,
  SearchIcon,
  Skeleton,
  StarIcon,
  XIcon,
  cn,
  toast,
} from '@repo/ui';

import { formatSwapTokenAmount, formatSwapUsdAmount } from './format';
import { swapMessages, translateSwapMessage } from './messages';
import { getSupportedWalletTokenGroups } from './tokenValue';
import {
  BNB_TOKEN,
  getSwapTokenQueryOptions,
  type SwapToken,
  useSwapTokens,
} from './useSwapTokens';
import { useSwapTokenValues } from './useSwapTokenValues';

type TokenSelectorProps = {
  open: boolean;
  side: 'pay' | 'receive';
  selected?: SwapToken;
  quickTokenPreset?: SwapToken[];
  onOpenChange: (open: boolean) => void;
  onSelect: (token: SwapToken) => void;
};

const TOKEN_ITEM_ANIMATION_MS = 200;

const TokenLogo = ({
  token,
  size = 32,
}: {
  token: SwapToken;
  size?: number;
}) => {
  const [failedLogoURI, setFailedLogoURI] = useState('');
  const needsFallback = !token.logoURI || failedLogoURI === token.logoURI;
  const fallbackQuery = useQuery({
    ...getSwapTokenQueryOptions(token.address),
    enabled: needsFallback,
  });
  const logoURI = fallbackQuery.data?.logoURI || token.logoURI;

  return (
    <CoinIcon
      src={logoURI}
      alt={token.symbol}
      size={size}
      className="shrink-0"
      onImageError={() => setFailedLogoURI(logoURI)}
    />
  );
};

const TokenRow = ({
  token,
  active,
  favorite,
  onSelect,
  onToggleFavorite,
}: {
  token: SwapToken;
  active: boolean;
  favorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) => {
  const { i18n } = useLingui();
  const symbol = token.symbol;

  return (
    <div
      className={cn(
        'hover:bg-bg-4 flex min-h-14 items-center gap-2 rounded-xl p-2 transition-colors',
        active ? 'bg-bg-4' : '',
      )}
    >
      <button
        type="button"
        className={cn(
          'flex size-4 shrink-0 items-center justify-center transition-colors duration-200',
          favorite ? 'text-accent' : 'text-bg-5 hover:text-t-430',
        )}
        aria-label={
          favorite
            ? translateSwapMessage(i18n, swapMessages.removeFavorite, {
                symbol,
              })
            : translateSwapMessage(i18n, swapMessages.addFavorite, { symbol })
        }
        aria-pressed={favorite}
        onClick={onToggleFavorite}
      >
        <StarIcon size={16} filled={favorite} />
      </button>
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={onSelect}
      >
        <TokenLogo token={token} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-medium">{token.symbol}</span>
          <span className="text-t-350 truncate text-xs">{token.name}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-medium">
            {formatSwapTokenAmount(token.balance || 0)}
          </span>
          <span className="text-t-350 text-xs">
            {token.usdValue && Number(token.usdValue) !== 0
              ? formatSwapUsdAmount(token.usdValue)
              : '$0'}
          </span>
        </span>
      </button>
    </div>
  );
};

const TokenRowSkeleton = () => (
  <div
    aria-hidden
    className="[&_[data-slot=skeleton]]:bg-bg-5 flex min-h-14 items-center gap-2 rounded-xl p-2"
  >
    <Skeleton className="size-4 shrink-0" />
    <Skeleton className="size-8 shrink-0 rounded-full" />
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <Skeleton className="h-[17px] w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1">
      <Skeleton className="h-[17px] w-12" />
      <Skeleton className="h-3 w-10" />
    </div>
  </div>
);

const TokenList = ({
  tokens,
  selected,
  favoriteAddresses,
  onSelect,
  onToggleFavorite,
}: {
  tokens: SwapToken[];
  selected?: SwapToken;
  favoriteAddresses: Set<string>;
  onSelect: (token: SwapToken) => void;
  onToggleFavorite: (token: SwapToken) => void;
}) => {
  const [items, setItems] = useState(() =>
    tokens.map((token) => ({ token, visible: true })),
  );

  useEffect(() => {
    const nextTokens = new Map(tokens.map((token) => [token.address, token]));
    let revealFrame = 0;

    const syncFrame = window.requestAnimationFrame(() => {
      setItems((current) => {
        const currentAddresses = new Set(
          current.map(({ token }) => token.address),
        );
        const existing = current.map((item) => ({
          token: nextTokens.get(item.token.address) || item.token,
          visible: nextTokens.has(item.token.address),
        }));
        const added = tokens.flatMap((token) =>
          currentAddresses.has(token.address)
            ? []
            : [{ token, visible: false }],
        );

        return [...existing, ...added];
      });

      revealFrame = window.requestAnimationFrame(() => {
        setItems((current) =>
          current.map((item) =>
            nextTokens.has(item.token.address)
              ? { ...item, visible: true }
              : item,
          ),
        );
      });
    });

    const removeTimer = window.setTimeout(() => {
      setItems((current) =>
        current.filter(({ token }) => nextTokens.has(token.address)),
      );
    }, TOKEN_ITEM_ANIMATION_MS);

    return () => {
      window.cancelAnimationFrame(syncFrame);
      window.cancelAnimationFrame(revealFrame);
      window.clearTimeout(removeTimer);
    };
  }, [tokens]);

  return (
    <div className="-mb-1 flex flex-col">
      {items.map(({ token, visible }) => (
        <div
          key={token.address}
          aria-hidden={!visible}
          inert={!visible}
          className={cn(
            'grid transition-[grid-template-rows,opacity,margin-bottom] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
            visible
              ? 'mb-1 grid-rows-[1fr] opacity-100'
              : 'pointer-events-none mb-0 grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <TokenRow
              token={token}
              active={selected?.address === token.address}
              favorite={favoriteAddresses.has(token.address)}
              onSelect={() => onSelect(token)}
              onToggleFavorite={() => onToggleFavorite(token)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const TokenSection = ({
  title,
  tokens,
  selected,
  favoriteAddresses,
  onSelect,
  onToggleFavorite,
}: {
  title: string;
  tokens: SwapToken[];
  selected?: SwapToken;
  favoriteAddresses: Set<string>;
  onSelect: (token: SwapToken) => void;
  onToggleFavorite: (token: SwapToken) => void;
}) => {
  const [open, setOpen] = useState(true);
  const hasTokens = tokens.length > 0;

  return (
    <div
      aria-hidden={!hasTokens}
      inert={!hasTokens}
      className={cn(
        'grid transition-[grid-template-rows,opacity,margin-bottom] duration-300 ease-in-out motion-reduce:transition-none',
        hasTokens
          ? 'mb-4 grid-rows-[1fr] opacity-100 last:mb-0'
          : 'pointer-events-none mb-0 grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <Collapsible
          className="flex flex-col"
          open={open}
          onOpenChange={setOpen}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-t-350 flex h-4 w-full items-center justify-between text-xs"
              aria-expanded={open}
            >
              {title}
              <span className="flex size-4 shrink-0 items-center justify-center">
                <Image
                  src="/trade-static/swap/token-section-chevron.svg"
                  alt=""
                  width={6}
                  height={4}
                  unoptimized
                  className={cn(
                    'h-1 w-[5.333px] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                    open ? '' : 'rotate-180',
                  )}
                />
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2" inert={!open}>
            <TokenList
              tokens={tokens}
              selected={selected}
              favoriteAddresses={favoriteAddresses}
              onSelect={onSelect}
              onToggleFavorite={onToggleFavorite}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

const HiddenTokensSection = ({
  title,
  tokens,
  hasVisibleTokens,
  selected,
  favoriteAddresses,
  onSelect,
  onToggleFavorite,
}: {
  title: string;
  tokens: SwapToken[];
  hasVisibleTokens: boolean;
  selected?: SwapToken;
  favoriteAddresses: Set<string>;
  onSelect: (token: SwapToken) => void;
  onToggleFavorite: (token: SwapToken) => void;
}) => {
  const [open, setOpen] = useState(false);
  const hasTokens = tokens.length > 0;

  return (
    <div
      aria-hidden={!hasTokens}
      inert={!hasTokens}
      className={cn(
        'grid transition-[grid-template-rows,opacity,margin-top] duration-300 ease-in-out motion-reduce:transition-none',
        hasTokens
          ? cn(
              'grid-rows-[1fr] opacity-100',
              hasVisibleTokens ? 'mt-2' : 'mt-0',
            )
          : 'pointer-events-none mt-0 grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="border-border text-t-350 flex h-6 w-full items-center justify-center gap-1 rounded-lg border px-2 text-xs"
              aria-expanded={open}
            >
              {title}
              <span className="flex size-4 shrink-0 items-center justify-center">
                <Image
                  src="/trade-static/swap/token-section-chevron.svg"
                  alt=""
                  width={6}
                  height={4}
                  unoptimized
                  className={cn(
                    'h-1 w-[5.333px] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                    open ? '' : 'rotate-180',
                  )}
                />
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2" inert={!open}>
            <TokenList
              tokens={tokens}
              selected={selected}
              favoriteAddresses={favoriteAddresses}
              onSelect={onSelect}
              onToggleFavorite={onToggleFavorite}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

const YourTokensSection = ({
  title,
  hiddenTitle,
  loading,
  tokens,
  hiddenTokens,
  selected,
  favoriteAddresses,
  onSelect,
  onToggleFavorite,
}: {
  title: string;
  hiddenTitle: string;
  loading: boolean;
  tokens: SwapToken[];
  hiddenTokens: SwapToken[];
  selected?: SwapToken;
  favoriteAddresses: Set<string>;
  onSelect: (token: SwapToken) => void;
  onToggleFavorite: (token: SwapToken) => void;
}) => {
  const [open, setOpen] = useState(true);
  const hasVisibleTokens = tokens.length > 0;
  const hasTokens = loading || hasVisibleTokens || hiddenTokens.length > 0;

  return (
    <div
      aria-hidden={!hasTokens}
      inert={!hasTokens}
      className={cn(
        'grid transition-[grid-template-rows,opacity,margin-bottom] duration-300 ease-in-out motion-reduce:transition-none',
        hasTokens
          ? 'mb-4 grid-rows-[1fr] opacity-100'
          : 'pointer-events-none mb-0 grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <Collapsible
          className="flex flex-col"
          open={open}
          onOpenChange={setOpen}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-t-350 flex h-4 w-full items-center justify-between text-xs"
              aria-expanded={open}
            >
              {title}
              <span className="flex size-4 shrink-0 items-center justify-center">
                <Image
                  src="/trade-static/swap/token-section-chevron.svg"
                  alt=""
                  width={6}
                  height={4}
                  unoptimized
                  className={cn(
                    'h-1 w-[5.333px] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                    open ? '' : 'rotate-180',
                  )}
                />
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2" inert={!open}>
            {loading ? (
              <TokenRowSkeleton />
            ) : hasVisibleTokens ? (
              <TokenList
                tokens={tokens}
                selected={selected}
                favoriteAddresses={favoriteAddresses}
                onSelect={onSelect}
                onToggleFavorite={onToggleFavorite}
              />
            ) : null}
            {loading ? null : (
              <HiddenTokensSection
                title={hiddenTitle}
                tokens={hiddenTokens}
                hasVisibleTokens={hasVisibleTokens}
                selected={selected}
                favoriteAddresses={favoriteAddresses}
                onSelect={onSelect}
                onToggleFavorite={onToggleFavorite}
              />
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

const TokenSelector = ({
  open,
  side,
  selected,
  quickTokenPreset,
  onOpenChange,
  onSelect,
}: TokenSelectorProps) => {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const {
    quickTokens: rawQuickTokens,
    favorites: rawFavorites,
    favoriteAddresses,
    recommended: rawRecommended,
    searchResults: rawSearchResults,
    isSearching,
    toggleFavorite,
  } = useSwapTokens(search, quickTokenPreset);
  const { values: tokenValues, isLoading: areWalletTokensLoading } =
    useSwapTokenValues(
      [
        ...rawQuickTokens,
        ...rawFavorites,
        ...rawRecommended,
        ...rawSearchResults,
      ],
      open,
    );
  const withValues = (tokens: SwapToken[]) =>
    tokens.map((token) => ({
      ...token,
      ...tokenValues[token.address],
    }));
  const quickTokens = withValues(rawQuickTokens);
  const favorites = withValues(rawFavorites);
  const recommended = withValues(rawRecommended);
  const searchResults = withValues(rawSearchResults);
  const { tokens: yourTokens, hiddenTokens: hiddenYourTokens } =
    getSupportedWalletTokenGroups([
      ...quickTokens,
      ...favorites,
      ...recommended,
    ]);
  const quickTokensDragRef = useRef({
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(input.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [input]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setInput('');
      setSearch('');
    }
    onOpenChange(nextOpen);
  };

  const handleSelect = (token: SwapToken) => {
    void queryClient
      .fetchQuery(getSwapTokenQueryOptions(token.address))
      .then((verifiedToken) => {
        onSelect({
          ...verifiedToken,
          name: token.name,
          symbol: token.symbol,
          price: token.price || verifiedToken.price,
          balance: token.balance,
          usdValue: token.usdValue,
        });
        handleOpenChange(false);
      })
      .catch(() => toast.error(t`Failed to load token details`));
  };

  const handleQuickTokensPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    quickTokensDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      moved: false,
    };
  };

  const handleQuickTokensPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const drag = quickTokensDragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(distance) > 4) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!drag.moved) return;

    event.preventDefault();
    event.currentTarget.scrollLeft = drag.startScrollLeft - distance;
  };

  const handleQuickTokensPointerEnd = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const drag = quickTokensDragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.pointerId = -1;
    if (drag.moved) {
      window.requestAnimationFrame(() => {
        drag.moved = false;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-swap-launcher-layer
        overlayClassName="swap-launcher-layer"
        closeClassName="hidden"
        className="bg-bg-3 !flex h-[631px] !w-[360px] flex-col gap-4 rounded-2xl p-3"
        aria-describedby={undefined}
      >
        <div className="flex h-6 shrink-0 items-center justify-between">
          <DialogTitle className="text-base leading-tight font-medium">
            {side === 'pay' ? t`Select pay token` : t`Select receive token`}
          </DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              className="flex size-6 items-center justify-center"
              aria-label={t({ message: 'Close', context: 'Swap' })}
            >
              <XIcon size={24} />
            </button>
          </DialogClose>
        </div>

        <label className="bg-bg-4 flex h-10 shrink-0 items-center gap-3 rounded-xl px-3">
          <SearchIcon size={20} className="shrink-0" />
          <input
            value={input}
            className="placeholder:text-t-430 min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder={t`Search by token or paste address`}
            onChange={(event) => setInput(event.target.value)}
          />
          <span className="h-3 w-px bg-[#BFCFFF]/10" aria-hidden />
          <TokenLogo token={BNB_TOKEN} size={20} />
        </label>

        {!search ? (
          <div className="relative h-8 shrink-0 overflow-hidden">
            <div
              className="scrollbar-none flex h-8 cursor-grab touch-pan-x items-center gap-2 overflow-x-auto overflow-y-hidden overscroll-y-none pr-8 select-none active:cursor-grabbing"
              onPointerDown={handleQuickTokensPointerDown}
              onPointerMove={handleQuickTokensPointerMove}
              onPointerUp={handleQuickTokensPointerEnd}
              onPointerCancel={(event) => {
                handleQuickTokensPointerEnd(event);
                quickTokensDragRef.current.moved = false;
              }}
            >
              {quickTokens.map((token) => (
                <button
                  type="button"
                  key={token.address}
                  disabled={!token.price}
                  className="border-border enabled:hover:bg-bg-4 flex h-8 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-[background-color,border-color] duration-200 enabled:hover:border-transparent"
                  onClick={() => {
                    if (!quickTokensDragRef.current.moved) handleSelect(token);
                  }}
                >
                  <TokenLogo token={token} size={20} />
                  {token.symbol}
                </button>
              ))}
            </div>
            <span
              className="from-bg-3 pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l to-transparent"
              aria-hidden
            />
          </div>
        ) : null}

        <div
          className={cn(
            'scrollbar-none min-h-0 flex-1 overflow-y-auto pb-8 [mask-image:linear-gradient(to_bottom,#000_calc(100%-32px),transparent)]',
            isSearching && 'overflow-hidden pb-0 [mask-image:none]',
            search &&
              !isSearching &&
              !searchResults.length &&
              'flex items-center justify-center',
          )}
        >
          {search ? (
            isSearching ? (
              <Loading
                className="bg-transparent"
                innerClassName="border-accent border-t-transparent size-8"
                role="status"
                aria-label={t`Loading`}
              />
            ) : searchResults.length ? (
              <TokenList
                tokens={searchResults}
                selected={selected}
                favoriteAddresses={favoriteAddresses}
                onSelect={handleSelect}
                onToggleFavorite={toggleFavorite}
              />
            ) : (
              <div className="text-t-430 flex flex-col items-center gap-1 text-center text-sm/[18px]">
                <p>{t`No results`}</p>
              </div>
            )
          ) : (
            <div className="flex flex-col">
              <TokenSection
                title={t`Favorites`}
                tokens={favorites}
                selected={selected}
                favoriteAddresses={favoriteAddresses}
                onSelect={handleSelect}
                onToggleFavorite={toggleFavorite}
              />
              <YourTokensSection
                title={t`Your Tokens`}
                hiddenTitle={t`Hidden Tokens (<$1)`}
                loading={areWalletTokensLoading}
                tokens={yourTokens}
                hiddenTokens={hiddenYourTokens}
                selected={selected}
                favoriteAddresses={favoriteAddresses}
                onSelect={handleSelect}
                onToggleFavorite={toggleFavorite}
              />
              <TokenSection
                title={t`Recommend`}
                tokens={recommended}
                selected={selected}
                favoriteAddresses={favoriteAddresses}
                onSelect={handleSelect}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelector;
