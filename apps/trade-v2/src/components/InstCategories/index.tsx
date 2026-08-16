import { CSSProperties, FC } from 'react';
import { TradeTabs } from '@/common/components';
import { CATEGORY } from '@/services/rest/pools';
import { useInstCategories } from './hooks';

interface InstCategoriesProps {
  value: string;
  onChange: (value: string) => void;
  hideNewListed?: boolean;
  showFavorites?: boolean;
  showLaunchable?: boolean;
  onSwitchShowLaunchable?: (value: boolean) => void;
  showCredit?: boolean;
  availableCategories?: ReadonlySet<CATEGORY>;
  style?: CSSProperties;
}

const InstCategories: FC<InstCategoriesProps> = ({
  value,
  onChange,
  hideNewListed,
  showFavorites,
  showCredit = true,
  availableCategories,
  style,
}) => {
  const options = useInstCategories({
    hideNewListed,
    showFavorites,
    showCredit,
    availableCategories,
  });
  return (
    <div className="mb-2 flex gap-4 font-medium" style={style}>
      <TradeTabs
        value={value}
        onValueChange={onChange}
        options={options}
        className="gap-0"
        listClassName="z-2 flex gap-2 font-medium justify-start"
        labelClassName="rounded-xl px-4 py-2 data-[state=active]:text-t-1100 grow-0"
        activeBarClassName="z-1 bg-bg-4 rounded-xl px-4 py-2"
      />
      {/* 
      <Label className="text-t-270 hover:text-t-1100 ml-auto flex shrink-0 cursor-pointer items-center gap-2 font-normal hover:transition-[color] max-md:hidden">
        {t`Show Launchable`}
        <Switch
          aria-label={t`Show Launchable`}
          checked={showLaunchable}
          onCheckedChange={(checked) => onSwitchShowLaunchable(checked)}
        />
      </Label> */}
    </div>
  );
};

export default InstCategories;
