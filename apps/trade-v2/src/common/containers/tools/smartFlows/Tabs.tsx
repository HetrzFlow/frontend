import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { TradeTabs } from '@/common/components';

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
}

const Tabs: FC<TabsProps> = ({ value, onChange }) => {
  const { t } = useLingui();
  const options = [
    {
      value: 'all',
      label: t`All`,
    },
    {
      value: 'whales',
      label: t`Whales`,
    },
    {
      value: 'smartFlows',
      label: t`Smart Flows`,
    },
  ];
  return (
    <div className="flex gap-4 font-medium">
      <TradeTabs
        value={value}
        onValueChange={onChange}
        options={options}
        className="gap-0"
        listClassName="z-2 flex gap-1 font-medium justify-start"
        labelClassName="rounded-xl px-4 py-2 data-[state=active]:text-t-1100 grow-0"
        activeBarClassName="z-1 bg-bg-3 rounded-xl px-4 py-2"
      />
    </div>
  );
};

export default Tabs;
