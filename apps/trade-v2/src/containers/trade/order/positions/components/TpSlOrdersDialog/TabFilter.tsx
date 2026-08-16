import { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';

import { TradeTabs } from '@/common';

export type TpSlTab = 'tp' | 'sl';
export type TpSlSizeFilter = 'partial' | 'full';

interface TabFilterProps {
  tpCount: number;
  slCount: number;
  activeTab: TpSlTab;
  onTabChange: (tab: TpSlTab) => void;
  sizeFilter?: TpSlSizeFilter;
  onSizeFilterChange?: (filter: TpSlSizeFilter) => void;
}

const TabFilter: FC<TabFilterProps> = ({
  // tpCount,
  // slCount,
  activeTab,
  onTabChange,
  // sizeFilter,
  // onSizeFilterChange,
}) => {
  const { t } = useLingui();
  // const isMobile = useMediaQuery() === MEDIA_SIZES.SM;

  const options = useMemo(() => {
    // const countSpanClassName =
    //   'bg-bg-3 font-plex min-w-5 rounded-sm p-0.5 align-middle';
    // const countSpanSmClassName = 'ml-1';
    return [
      {
        value: 'tp' as const,
        label: (
          <>
            {t`Take Profit`}
            {/* {!tpCount ? null : isMobile ? (
              <span className={countSpanSmClassName}>({tpCount})</span>
            ) : (
              <span className={countSpanClassName}>{tpCount}</span>
            )} */}
          </>
        ),
        // activeBarClassName: isMobile ? 'bg-up' : '',
      },
      {
        value: 'sl' as const,
        label: (
          <>
            {t`Stop Loss`}
            {/* {!slCount ? null : isMobile ? (
              <span className={countSpanSmClassName}>({slCount})</span>
            ) : (
              <span className={countSpanClassName}>{slCount}</span>
            )} */}
          </>
        ),
        // activeBarClassName: isMobile ? 'bg-down' : '',
      },
    ];
  }, [t]);

  // const sizeFilterOptions = useMemo(
  //   () => [
  //     { value: 'partial' as const, label: t`Partial` },
  //     { value: 'full' as const, label: t`Full` },
  //   ],
  //   [t],
  // );

  return (
    <div className="flex flex-col gap-2">
      <TradeTabs
        className="w-auto gap-0"
        listClassName="grid-cols-2 gap-1"
        labelClassName="h-8 text-xs px-4 data-[state=active]:text-t-1100"
        activeBarClassName="bg-bg-3"
        disableAnimation
        value={activeTab}
        onValueChange={(v) => onTabChange(v as TpSlTab)}
        options={options}
      />
      {/* {sizeFilter !== undefined && onSizeFilterChange && (
        <div className="w-full max-md:flex md:hidden">
          <TradeTabs
            className="w-full gap-0"
            listClassName="grid-cols-2"
            labelClassName="h-7 text-xs data-[state=active]:text-t-1100"
            activeBarClassName="h-0.5 bg-white bottom-0"
            disableAnimation
            value={sizeFilter}
            onValueChange={(v) => onSizeFilterChange(v as TpSlSizeFilter)}
            options={sizeFilterOptions}
          />
        </div>
      )} */}
    </div>
  );
};

export default TabFilter;
