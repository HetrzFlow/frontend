'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { useLingui } from '@lingui/react/macro';
import { formatUnits } from 'viem';
import { unitFormat } from '@repo/lib/format';
import {
  Button,
  cn,
  Loading,
  MEDIA_SIZES,
  PowerIcon,
  ScrollBox,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  toast,
  useMediaQuery,
} from '@repo/ui';
import { usePrivy } from '@/common/chainClient';
import TradeTabs from '@/common/components/TradeTabs';
import AccountSelect from '@/common/containers/header/AccountDrawer/AccountSelect';
import {
  ActivityTabLabel,
  type ActivityView,
} from '@/common/containers/header/AccountDrawer/Activity';
import UnifiedTimeline from '@/common/containers/header/AccountDrawer/Activity/UnifiedTimeline';
import Vaults from '@/common/containers/header/AccountDrawer/Portfolio/Vaults';
import type { VaultItem } from '@/services/rest/vaults';
import { useVaultsListDataProvider } from '@/stores/synthetics/marketsData/provider';

interface PortfolioDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CURRENCY_FORMAT_OPTIONS = {
  style: 'currency',
  currency: 'USD',
  showMinDecimalValue: true,
  stripTrailingZeros: true,
} as const;

const getVaultHoldingsUsdRaw = (vault: VaultItem) => {
  try {
    const balance = BigInt(vault.tokens_balance ?? 0);
    const supply = BigInt(vault.supply ?? 0);
    const tvl = BigInt(vault.tvl ?? 0);
    return supply > 0n ? (balance * tvl) / supply : 0n;
  } catch {
    return 0n;
  }
};

const DrawerScrollBox = ({ children }: { children: ReactNode }) => (
  <ScrollBox
    className="min-h-0"
    shadowClassName="to-bg-drawer-shadow max-md:to-popover max-md:hidden absolute bottom-0 mx-4 max-md:mx-4 h-12 w-[calc(100%-calc(var(--spacing)*8))] bg-gradient-to-b from-transparent"
    scrollClassName="scrollbar-none relative flex h-full max-md:h-auto max-md:!overflow-y-visible flex-col gap-[12px] overflow-y-auto px-4 pb-4"
  >
    {children}
  </ScrollBox>
);

const GenesisBalance = ({ totalDeposits }: { totalDeposits?: string }) => {
  const { t } = useLingui();

  return (
    <div className="flex flex-col gap-4 px-4">
      <div>
        <div className="text-t-350 text-sm">{t`Net Worth`}</div>
        <div className="font-plex mt-2 text-[calc(var(--spacing)*8)]/tight font-medium">
          {totalDeposits === undefined
            ? '--'
            : unitFormat(totalDeposits, 2, CURRENCY_FORMAT_OPTIONS)}
        </div>
      </div>
    </div>
  );
};

const GenesisPortfolio = ({
  vaultAddresses,
  hasDeposits,
  loading,
}: {
  vaultAddresses: readonly string[];
  hasDeposits: boolean;
  loading: boolean;
}) => {
  const { t } = useLingui();

  return (
    <DrawerScrollBox>
      {loading ? (
        <Loading className="h-20" />
      ) : !hasDeposits ? (
        <div className="text-t-430 mt-2 text-center text-sm">
          {t`No open positions found.`}
        </div>
      ) : (
        <Vaults
          allowedVaultAddresses={vaultAddresses}
          enableNavigation={false}
        />
      )}
    </DrawerScrollBox>
  );
};

export const PortfolioDrawer = ({
  open,
  onOpenChange,
}: PortfolioDrawerProps) => {
  const { t } = useLingui();
  const { logout } = usePrivy();
  const mediaSz = useMediaQuery();
  const [tabValue, setTabValue] = useState('portfolio');
  const [activityView, setActivityView] = useState<ActivityView>('trade');
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);

  const { data: vaultsData, isLoading: vaultsLoading } =
    useVaultsListDataProvider({ enabled: open });
  const selectedVaults = useMemo(
    () => vaultsData?.items.filter((vault) => vault.is_predeposit) ?? [],
    [vaultsData?.items],
  );
  const vaultAddresses = useMemo(
    () => selectedVaults.map((vault) => vault.vault_address),
    [selectedVaults],
  );
  const totalDepositsRaw = useMemo(
    () =>
      selectedVaults.reduce(
        (total, vault) => total + getVaultHoldingsUsdRaw(vault),
        0n,
      ),
    [selectedVaults],
  );
  const totalDeposits = formatUnits(totalDepositsRaw, USD_DECIMALS);
  const hasDeposits = totalDepositsRaw > 0n;

  const handleDisconnect = useCallback(async () => {
    toast.loading(t`Disconnecting`, { id: 'account-logout' });
    await logout();
    toast.info(t`Disconnected`, { id: 'account-logout' });
  }, [logout, t]);

  const options = useMemo(
    () => [
      {
        value: 'portfolio',
        label: t`Portfolio`,
        labelClassName:
          'data-[state=active]:text-foreground pt-[4px] pb-[8px]',
        content: (
          <GenesisPortfolio
            vaultAddresses={vaultAddresses}
            hasDeposits={hasDeposits}
            loading={vaultsLoading}
          />
        ),
      },
      {
        value: 'activity',
        label: (
          <ActivityTabLabel
            value={activityView}
            onChange={setActivityView}
            onOpen={() => setTabValue('activity')}
          />
        ),
        labelClassName:
          'data-[state=active]:text-foreground pt-[4px] pb-[8px]',
        onTriggerClick: () => setActivityView('trade'),
        content: (
          <UnifiedTimeline
            view={activityView}
            isPredeposit
            fillAvailableHeight
          />
        ),
      },
    ],
    [activityView, hasDeposits, t, vaultAddresses, vaultsLoading],
  );

  useEffect(() => {
    const isMobile = mediaSz === MEDIA_SIZES.SM;
    const root = scrollEl;

    if (!isMobile) setIsTabsSticky(false);
    if (!sentinelEl || !root || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const rootTop = entry.rootBounds?.top ?? 0;
        setIsTabsSticky(entry.boundingClientRect.top < rootTop);
      },
      { root, threshold: [0, 1] },
    );
    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [mediaSz, scrollEl, sentinelEl]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={mediaSz === MEDIA_SIZES.SM ? 'bottom' : 'right'}
        className="accountDrawerContainer gap-0 rounded-2xl max-md:h-[calc(100dvh-60px)] md:w-[360px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader className="p-4">
          <SheetTitle className="flex h-[32px] items-center justify-between gap-4 font-medium">
            <span className="text-2xl font-semibold md:hidden">
              {t`Overview`}
            </span>
            <AccountSelect className="max-md:hidden" />
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-t-270 bg-t-1100/10 mr-9.5 rounded-xl hover:bg-t-1100/10 max-md:hidden"
              title={t`Disconnect Wallet`}
              onClick={() => void handleDisconnect()}
            >
              <PowerIcon className="mx-auto" />
            </Button>
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t`Account overview drawer with portfolio and activity information.`}
          </SheetDescription>
        </SheetHeader>
        <div
          ref={setScrollEl}
          className="max-md:scrollbar-none flex min-h-0 flex-1 flex-col max-md:overflow-y-auto"
        >
          <GenesisBalance totalDeposits={totalDeposits} />
          <div className="mt-4" />
          <div ref={setSentinelEl} className="h-px shrink-0" aria-hidden />
          <TradeTabs
            value={tabValue}
            options={options}
            className="gap-3 md:min-h-0 md:flex-1"
            contentWrapClassName="md:min-h-0 md:flex-1"
            contentClassName="md:min-h-0"
            animationClassName="md:min-h-0"
            listWrapClassName={cn(
              'max-md:!sticky max-md:top-0 max-md:z-10',
              isTabsSticky && 'max-md:bg-[#1b2c2f] max-md:-top-px',
            )}
            listClassName="grid-cols-2 mx-4 px-0 border-border rounded-none border-b-1 w-[calc(100%-32px)]"
            activeBarClassName="-z-1 top-7.5 rounded-none h-0.5 bg-white"
            onValueChange={setTabValue}
          />
        </div>
        <SheetFooter className="md:hidden">
          <AccountSelect className="bg-bg-3 rounded-lg px-4 py-[10px]" />
          <Button
            variant="accent"
            className="text-sm"
            onClick={() => void handleDisconnect()}
          >
            {t`Disconnect`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
