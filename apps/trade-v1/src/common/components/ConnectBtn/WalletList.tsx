import { FC, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useWallets } from '@mysten/dapp-kit';

import { MEDIA_SIZES, useMediaQuery } from '@repo/ui';
import { useWalletStore } from '../../stores/walletStore';

// whitelist wallets
const PREFERRED_WALLETS = [
  {
    name: 'Slush',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMjRDMCAxMC43NDUyIDEwLjc0NTIgMCAyNCAwQzM3LjI1NDggMCA0OCAxMC43NDUyIDQ4IDI0QzQ4IDM3LjI1NDggMzcuMjU0OCA0OCAyNCA0OEMxMC43NDUyIDQ4IDAgMzcuMjU0OCAwIDI0WiIgZmlsbD0iIzBDMEExRiIvPgo8cGF0aCBkPSJNMTMuMTM1OCAzMi4xMDg1QzE0LjE3MDEgMzUuOTY4MyAxOC4wMzMxIDM5LjQ2MjQgMjYuMDI1NSAzNy4zMjA4QzMzLjY1MTUgMzUuMjc3NCAzOC40MzA5IDI5LjAwNCAzNy4xOTE2IDI0LjM3ODlDMzYuNzYzNiAyMi43ODE3IDM1LjQ3NDYgMjEuNzAwNiAzMy40ODcyIDIxLjg3NjVMMTUuNzE2NSAyMy4zNTcyQzE0LjU5NzMgMjMuNDQzIDE0LjA4NDIgMjMuMjU5NiAxMy43ODgxIDIyLjU1NDNDMTMuNTAxIDIxLjg4MjMgMTMuNjY0NiAyMS4xNjA5IDE1LjAxNjMgMjAuNDc3N0wyOC41NDAxIDEzLjUzNzRDMjkuNTc2NyAxMy4wMSAzMC4yNjcxIDEyLjc4OTMgMzAuODk4IDEzLjAxMjZDMzEuMjkzNCAxMy4xNTYzIDMxLjU1MzggMTMuNzI4NCAzMS4zMTQ3IDE0LjQzNDRMMzAuNDM3OCAxNy4wMjMyQzI5LjM2MTcgMjAuMjAwMiAzMS42NjUzIDIwLjkzODIgMzIuOTY0MSAyMC41OTAyQzM0LjkyODkgMjAuMDYzNyAzNS4zOTExIDE4LjE5MjMgMzQuNzU4MSAxNS44Mjk5QzMzLjE1MzMgOS44NDA1NCAyNi43OTkgOC45MDQxMSAyMS4wMzc4IDEwLjQ0NzhDMTUuMTc2NyAxMi4wMTgzIDEwLjA5NiAxNi43Njc2IDExLjY0NzQgMjIuNTU3M0MxMi4wMTI5IDIzLjkyMTYgMTMuMjY4NyAyNS4wMTE2IDE0LjcyMzIgMjQuOTc4NUwxNi45NDM4IDI0Ljk3MzFDMTcuNDAwNCAyNC45NjI1IDE3LjIzNiAyNSAxOC4xMTcgMjQuOTI3MUMxOC45OTggMjQuODU0MSAyMS4zNTA5IDI0LjU2NDYgMjEuMzUwOSAyNC41NjQ2TDMyLjg5NjIgMjMuMjU4TDMzLjE5MzcgMjMuMjE0OEMzMy44Njg5IDIzLjA5OTcgMzQuMzc5MiAyMy4yNzUgMzQuODEwNiAyNC4wMTgzQzM1LjQ1NjMgMjUuMTMwNCAzNC40NzEyIDI1Ljk2OTEgMzMuMjkyIDI2Ljk3MzFDMzMuMjYwNSAyNyAzMy4yMjg4IDI3LjAyNyAzMy4xOTcgMjcuMDU0MUwyMy4wNDgyIDM1LjgwMDVDMjEuMzA4NyAzNy4zMDA4IDIwLjA4NjcgMzYuNzM2NyAxOS42NTg4IDM1LjEzOTVMMTguMTQzMSAyOS40ODI5QzE3Ljc2ODcgMjguMDg1NCAxNi40MDQxIDI2Ljk4ODkgMTQuODA1NiAyNy40MTcyQzEyLjgwNzUgMjcuOTUyNiAxMi42NDU1IDMwLjI3ODQgMTMuMTM1OCAzMi4xMDg1WiIgZmlsbD0iI0ZCRkFGRiIvPgo8L3N2Zz4K',
    link: 'https://slush.app',
  },
  {
    name: 'OKX Wallet',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJDSURBVHgB7Zq9jtpAEMfHlhEgQLiioXEkoAGECwoKxMcTRHmC5E3IoyRPkPAEkI7unJYmTgEFTYwA8a3NTKScLnCHN6c9r1e3P2llWQy7M/s1Gv1twCP0ej37dDq9x+Zut1t3t9vZjDEHIiSRSPg4ZpDL5fxkMvn1cDh8m0wmfugfO53OoFQq/crn8wxfY9EymQyrVCqMfHvScZx1p9ls3pFxXBy/bKlUipGPrVbLuQqAfsCliq3zl0H84zwtjQrOw4Mt1W63P5LvBm2d+Xz+YzqdgkqUy+WgWCy+Mc/nc282m4FqLBYL+3g8fjDxenq72WxANZbLJeA13zDX67UDioL5ybXwafMYu64Ltn3bdDweQ5R97fd7GyhBQMipx4POeEDHIu2LfDdBIGGz+hJ9CQ1ABjoA2egAZPM6AgiCAEQhsi/C4jHyPA/6/f5NG3Ks2+3CYDC4aTccDrn6ojG54MnEvG00GoVmWLIRNZ7wTCwDHYBsdACy0QHIhiuRETxlICWpMMhGZHmqS8qH6JLyGegAZKMDkI0uKf8X4SWlaZo+Pp1bRrwlJU8ZKLIvUjKh0WiQ3sRUbNVq9c5Ebew7KEo2m/1p4jJ4qAmDaqDQBzj5XyiAT4VCQezJigAU+IDU+z8vJFnGWeC+bKQV/5VZ71FV6L7PA3gg3tXrdQ+DgLhC+75Wq3no69P3MC0NFQpx2lL04Ql9gHK1bRDjsSBIvScBnDTk1WrlGIZBorIDEYJj+rhdgnQ67VmWRe0zlplXl81vcyEt0rSoYDUAAAAASUVORK5CYII=',
    link: 'https://web3.okx.com',
  },
  {
    name: 'Suiet',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMjQiIGZpbGw9InVybCgjcGFpbnQwX3JhZGlhbF8zMDVfMTI1MTYpIi8+PHBhdGggZD0iTTUxLjUgNDMuNmMtMy45IDAtNy42LTMuOS05LjUtNi40LTEuOSAyLjUtNS42IDYuNC05LjUgNi40LTQgMC03LjctMy45LTkuNS02LjQtMS44IDIuNS01LjUgNi40LTkuNSA2LjQtLjggMC0xLjUtLjYtMS41LTEuNSAwLS44LjctMS41IDEuNS0xLjUgMy4yIDAgNy4xLTUuMSA4LjItNi45LjMtLjQuOC0uNyAxLjMtLjdzMSAuMiAxLjMuN2MxLjEgMS44IDUgNi45IDguMiA2LjkgMy4xIDAgNy4xLTUuMSA4LjItNi45LjMtLjQuOC0uNyAxLjMtLjdzMSAuMiAxLjIuN2MxLjEgMS44IDUgNi45IDguMiA2LjkuOSAwIDEuNi43IDEuNiAxLjUgMCAuOS0uNiAxLjUtMS41IDEuNXoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNNTEuNSA1Mi4zYy0zLjkgMC03LjYtMy45LTkuNS02LjQtMS45IDIuNS01LjYgNi40LTkuNSA2LjQtNCAwLTcuNy0zLjktOS41LTYuNC0xLjggMi41LTUuNSA2LjQtOS41IDYuNC0uOCAwLTEuNS0uNi0xLjUtMS41IDAtLjguNy0xLjUgMS41LTEuNSAzLjIgMCA3LjEtNS4xIDguMi02LjkuMy0uNC44LS43IDEuMy0uN3MxIC4zIDEuMy43YzEuMSAxLjggNSA2LjkgOC4yIDYuOSAzLjEgMCA3LjEtNS4xIDguMi02LjkuMy0uNC44LS43IDEuMy0uN3MxIC4zIDEuMi43YzEuMSAxLjggNSA2LjkgOC4yIDYuOS45IDAgMS42LjcgMS42IDEuNSAwIC45LS42IDEuNS0xLjUgMS41ek0xNC42IDM2LjdjLS44IDAtMS40LS41LTEuNi0xLjNsLS4zLTMuNmMwLTEwLjkgOC45LTE5LjggMTkuOC0xOS44IDExIDAgMTkuOCA4LjkgMTkuOCAxOS44bC0uMyAzLjZjLS4xLjgtLjkgMS40LTEuNyAxLjItLjktLjEtMS41LS45LTEuMy0xLjhsLjMtM2MwLTkuMi03LjUtMTYuOC0xNi44LTE2LjgtOS4yIDAtMTYuNyA3LjUtMTYuNyAxNi44bC4yIDMuMWMuMi44LS4zIDEuNi0xLjEgMS44aC0uM3oiIGZpbGw9IiNmZmYiLz48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9InBhaW50MF9yYWRpYWxfMzA1XzEyNTE2IiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDUyLjc1ODAzIDUxLjM1OCAtNTEuNDM5NDcgNTIuODQxNzIgMCA3LjQwNykiPjxzdG9wIHN0b3AtY29sb3I9IiMwMDU4REQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM2N0M4RkYiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48L3N2Zz4=',
    link: 'https://suiet.app',
  },
];

interface WalletListProps {
  onWalletSelect: (wallet: ReturnType<typeof useWallets>[0]) => void;
}

const WalletList: FC<WalletListProps> = ({ onWalletSelect }) => {
  const { t } = useLingui();
  const wallets = useWallets();
  const recentWalletName = useWalletStore((state) => state.recentWalletName);
  const network = useWalletStore((state) => state.network);
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;

  // installed wallets
  const installedWallets = useMemo(() => {
    return Object.fromEntries(
      wallets.map((v) => {
        // slush web
        const isWebWallet = v.id === 'com.mystenlabs.suiwallet.web';
        return [
          v.name,
          { wallet: v, isExtensionWallet: !isWebWallet, isWebWallet },
        ];
      }),
    );
  }, [wallets]);

  // sort
  const sortedWalletList = useMemo(() => {
    return [...PREFERRED_WALLETS]
      .filter(
        (v) =>
          (network === 'testnet' ? v.name !== 'OKX Wallet' : v) &&
          // only show installed wallet in mobile
          (isMobile ? installedWallets[v.name] : v),
      )
      .sort((a, b) => {
        const aWallet = installedWallets[a.name];
        const bWallet = installedWallets[b.name];
        // current sellect wallet
        if (
          bWallet &&
          [bWallet.wallet.id, bWallet.wallet.name].includes(recentWalletName)
        ) {
          return 1;
        }
        if (
          aWallet &&
          [aWallet.wallet.id, aWallet.wallet.name].includes(recentWalletName)
        ) {
          return -1;
        }

        // installed extension wallet
        if (bWallet && bWallet?.isExtensionWallet) {
          return 1;
        }
        if (aWallet && aWallet?.isExtensionWallet) {
          return -1;
        }

        // other installed wallet
        if (bWallet) {
          return 1;
        }

        return -1;
      });
  }, [installedWallets, recentWalletName, network, isMobile]);

  return (
    <div className="flex flex-col gap-4">
      {sortedWalletList.map(({ name, icon, link }) => {
        const wallet = installedWallets[name];
        return (
          <a
            key={name}
            href={wallet ? undefined : link}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <div
              className="hover:bg-bg-3 flex h-14 cursor-pointer items-center rounded-lg px-4 py-2"
              onClick={() => {
                if (wallet) {
                  onWalletSelect(wallet.wallet);
                }
              }}
            >
              <img
                src={wallet?.wallet.icon || icon}
                height={32}
                width={32}
                alt={name}
                className={'rounded-lg'}
              />
              <div className="ml-2 flex flex-col text-base leading-tight font-medium">
                {name}
                <div className="text-t-270 text-xs font-normal">
                  {wallet && [name, wallet.wallet.id].includes(recentWalletName)
                    ? t`Recent`
                    : ''}
                </div>
              </div>
              <div className="text-t-270 ml-auto text-base">
                {wallet?.isExtensionWallet ? t`Installed` : ''}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default WalletList;
