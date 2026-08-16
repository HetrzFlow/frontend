import { FC, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { DEFAULT_LOCALE } from '@repo/i18n/const';

import AccountDrawer from './AccountDrawer';
import ClaimFaucet from './ClaimFaucet';
import { Context } from './context';
import Logo from './Logo';
import Nav from './Nav';
import Settings from './Settings';

interface ContentProps {
  clientRoutes: string[];
  rightNav?: ReactNode;
}

const Content: FC<ContentProps> = ({ clientRoutes, rightNav }) => {
  const pathname = usePathname();
  const {
    i18n: { locale: curLocale },
  } = useLingui();
  const activeItem = useMemo(() => {
    return pathname.split('/')[curLocale === DEFAULT_LOCALE ? 1 : 2] || '';
  }, [pathname, curLocale]);

  return (
    <header className="mx-4 flex h-[56px] items-center text-sm max-md:text-xs">
      <Context.Provider value={{ inTradePage: activeItem === 'trade' }}>
        {/* logo */}
        <Logo isInternalLink={clientRoutes.includes('')} />
        {/* nav */}
        <Nav
          activeItem={activeItem}
          clientRoutes={clientRoutes}
          className="hiddenIn404"
        />
        {/* right nav items */}
        <div className="hiddenIn404 scrollbar-none ml-auto flex flex-grow-0 items-center gap-2 overflow-x-auto">
          <div className="flex flex-grow-0 items-center gap-2 max-md:flex-row-reverse">
            <ClaimFaucet size="lg" className="rounded-full p-4" />
            <AccountDrawer />
          </div>
          {/* <LocaleSwitch /> */}
          <Settings />
          {rightNav}
        </div>
      </Context.Provider>
    </header>
  );
};

export default Content;
