'use client';

import { useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useDisconnectWallet } from '@mysten/dapp-kit';
import {
  SheetHeader,
  SheetTitle,
  SheetContent,
  PowerIcon,
  toast,
  SheetFooter,
  Button,
  useMediaQuery,
  MEDIA_SIZES,
} from '@repo/ui';

import TradeTabs from '../../../components/TradeTabs';
import AccountSelect from './AccountSelect';
import Activity from './Activity';
import Balance from './Balance';
import Portfolia from './Portfolio';

const Content: React.FC = () => {
  const { t } = useLingui();
  const { mutate: disconnectWallet } = useDisconnectWallet();

  const [tabValue, setTabValue] = useState('portfolia');
  const options = useMemo(() => {
    return [
      {
        value: 'portfolia',
        label: t`Portfolio`,
        labelClassName: 'data-[state=active]:text-foreground pt-[4px] pb-[8px]',
        activeBarClassName: '-z-1 h-0.5 bg-black dark:bg-white',
        content: <Portfolia />,
      },
      {
        value: 'activity',
        label: t`Activity`,
        labelClassName: 'data-[state=active]:text-foreground pt-[4px] pb-[8px]',
        activeBarClassName: '-z-1 h-0.5 bg-black dark:bg-white',
        content: <Activity />,
      },
    ];
  }, [t]);

  const mediaSz = useMediaQuery();

  return (
    <SheetContent
      side={mediaSz === MEDIA_SIZES.SM ? 'bottom' : 'right'}
      className="gap-0 max-md:h-[calc(100dvh-60px)] max-md:rounded-2xl md:w-[420px]"
    >
      <SheetHeader>
        <SheetTitle className="flex h-[32px] items-center justify-between gap-4 font-medium">
          <span className="text-2xl font-semibold md:hidden">{t`Overview`}</span>
          <AccountSelect className="max-md:hidden" />
          <div
            className="bg-bg-3 hover:text-t-270 mr-9.5 size-8 cursor-pointer rounded-full max-md:hidden"
            title={t`Disconnect Wallet`}
            onClick={() => {
              disconnectWallet();
              toast.info(t`Disconnected`);
            }}
          >
            <PowerIcon className="mx-auto mt-1" />
          </div>
        </SheetTitle>
      </SheetHeader>
      <Balance />
      <div className="mt-[20px]" />
      <TradeTabs
        value={tabValue}
        options={options}
        className="gap-3"
        listClassName="grid-cols-2 mx-6 px-0 border-border rounded-none border-b-1 w-[calc(100%-48px)]"
        onValueChange={setTabValue}
      />
      <SheetFooter className="md:hidden">
        <AccountSelect className="bg-bg-3 rounded-lg px-4 py-[10px]" />
        <Button
          variant="accent"
          className="text-sm"
          onClick={() => {
            disconnectWallet();
            toast.info(t`Disconnected`);
          }}
        >{t`Disconnect`}</Button>
      </SheetFooter>
    </SheetContent>
  );
};

export default Content;
