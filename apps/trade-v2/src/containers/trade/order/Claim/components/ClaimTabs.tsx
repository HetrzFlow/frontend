import { FC, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { TradeTabs } from '@/common';

interface ClaimTabsProps {
  activeTab: 'pending' | 'history';
  onTabChange: (tab: 'pending' | 'history') => void;
}

const ClaimTabs: FC<ClaimTabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLingui();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const options = useMemo(() => {
    return [
      { value: 'pending', label: t`Claimable` },
      { value: 'history', label: t`History` },
    ];
  }, [t]);

  const handleTabChange = (tab: string) => {
    if (tab !== 'pending' && tab !== 'history') return;

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set('claimTab', tab);
    router.replace(`${pathname}?${nextSearchParams.toString()}`, {
      scroll: false,
    });
    onTabChange(tab);
  };

  return (
    <TradeTabs
      className="w-max gap-0"
      listClassName="grid-cols-2 gap-1"
      labelClassName="h-8 text-xs px-4 data-[state=active]:text-t-1100"
      activeBarClassName="bg-bg-3"
      value={activeTab}
      onValueChange={handleTabChange}
      options={options}
    />
  );
};

export default ClaimTabs;
