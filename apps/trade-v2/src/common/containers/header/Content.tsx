import { FC, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { LocaleSwitch, Logo } from '@repo/common/components';
import { useNavItems } from '@repo/common/hooks';
import { SUPPORTED_LOCALES } from '@repo/i18n/const';
import { cn, GradientBorder } from '@repo/ui';
import { useWalletStore } from '../../stores/walletStore';

import AccountDrawer from './AccountDrawer';
import ClaimFaucet from './ClaimFaucet';
import { Context } from './context';
import { MobileGenesisEntry } from './MobileGenesisEntry';
import Nav from './Nav';
import Settings from './Settings';

interface ContentProps {
  rightNav?: ReactNode;
  genesisStandalone?: boolean;
  mobileSwapOpen?: boolean;
  onMobileSwapClose?: () => void;
  onMobileSwapOpen?: () => void;
}

const SHOW_GENESIS_ENTRY =
  process.env.NEXT_PUBLIC_SHOW_GENESIS_ENTRY === 'true';

const GenesisEntryIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    className="size-4 shrink-0 text-[#e5ff77]"
  >
    <path
      d="M12.3297 4.04199C10.4063 4.58887 10.0563 6.14043 10.1875 7.1248C8.80942 5.50762 8.87505 3.67012 8.87505 1.00293C4.47974 2.66543 5.50786 7.43105 5.37661 8.8748C4.28286 7.97793 4.06411 5.81387 4.06411 5.81387C2.9063 6.40449 2.31567 8.02168 2.31567 9.3123C2.31567 12.4607 4.85161 14.9967 8.00005 14.9967C11.1485 14.9967 13.6844 12.4607 13.6844 9.3123C13.6844 7.45293 12.3079 6.57793 12.3297 4.04199Z"
      fill="currentColor"
    />
  </svg>
);

const Content: FC<ContentProps> = ({
  rightNav,
  genesisStandalone = false,
  mobileSwapOpen,
  onMobileSwapClose,
  onMobileSwapOpen,
}) => {
  const { t } = useLingui();
  const pathname = usePathname();
  const network = useWalletStore((state) => state.network);
  const navItems = useNavItems();
  const genesisEntryLabel = t`Genesis Vault`;
  const activeItem = useMemo(() => {
    const pathParams = pathname.split('/');
    return (
      (SUPPORTED_LOCALES.includes(pathParams[1]!)
        ? pathParams[2]
        : pathParams[1]) || ''
    );
  }, [pathname]);
  const isGenesis = genesisStandalone || activeItem === 'genesis';

  return (
    <>
      <header
        data-site-header
        className={cn(
          'relative z-20 flex h-[58px] items-center px-5 py-2 text-xs transition-[background-color,backdrop-filter,box-shadow] duration-300',
          activeItem === 'pools' && !mobileSwapOpen && 'bg-transparent',
          activeItem === 'leaderboard' && !mobileSwapOpen && 'bg-transparent',
        )}
      >
        <Context.Provider value={{ inTradePage: activeItem === 'trade' }}>
          {/* logo */}
          <Logo
            showTag
            network={network}
            textIconClassName="text-t-1100!"
            iconSize={24}
          />
          {/* nav */}
          {!isGenesis ? (
            <Nav
              activeItem={activeItem}
              className="hiddenIn404"
              mobileSwapOpen={mobileSwapOpen}
              onMobileSwapClose={onMobileSwapClose}
              onMobileSwapOpen={onMobileSwapOpen}
            />
          ) : null}
          {/* right nav items */}
          <div className="hiddenIn404 scrollbar-none ml-auto flex flex-grow-0 items-center gap-2 overflow-x-auto">
            <div className="flex shrink-0 flex-grow-0 items-center gap-2 max-md:flex-row-reverse">
              {!isGenesis ? (
                <ClaimFaucet size="lg" className="rounded-xl p-4" />
              ) : null}
              <div className="flex items-center gap-2">
                {SHOW_GENESIS_ENTRY && !isGenesis ? (
                  <GradientBorder
                    outerClassName="isolate h-8 w-fit shrink-0 rounded-full before:rounded-full before:bg-[linear-gradient(90deg,#e5ff77_0%,var(--accent)_100%)] max-md:hidden"
                    innerClassName="bg-bg-2 rounded-[15px]"
                  >
                    <a
                      href={navItems.genesis.link}
                      aria-label={genesisEntryLabel}
                      className="flex h-full items-center gap-2 rounded-[15px] px-[11px] text-xs font-medium focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                      rel="noopener noreferrer"
                    >
                      <GenesisEntryIcon />
                      <span className="bg-[linear-gradient(90deg,#e5ff77_0%,var(--accent)_100%)] bg-clip-text whitespace-nowrap text-transparent">
                        {genesisEntryLabel}
                      </span>
                    </a>
                  </GradientBorder>
                ) : null}
                <AccountDrawer genesis={isGenesis} />
              </div>
            </div>
            <LocaleSwitch
              triggerClassName="text-primary-foreground hover:bg-bg-4 bg-bg-3 flex size-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl transition-none duration-300 hover:transition-[background] max-md:h-[32px]"
              iconClassName="size-5"
            />
            <Settings />
            {rightNav}
          </div>
        </Context.Provider>
      </header>

      {SHOW_GENESIS_ENTRY && !isGenesis && !mobileSwapOpen ? (
        <MobileGenesisEntry href={navItems.genesis.link} />
      ) : null}
    </>
  );
};

export default Content;
