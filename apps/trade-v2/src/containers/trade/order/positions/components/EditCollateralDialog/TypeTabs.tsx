import { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';

import { TradeTabs } from '@/common';
import { TYPE } from './enum';
import TypeTabContent from './TypeTabContent';

interface TypeTabsProps {
  className?: string;
  value: string;
  onChange: (v: string) => void;
}

const TypeTabs: FC<TypeTabsProps> = ({ value, onChange }) => {
  const { t } = useLingui();

  const options = useMemo(() => {
    return [
      {
        value: TYPE.deposit,
        label: t`Deposit`,
        activeBarClassName: 'bg-accent',
        content: <TypeTabContent />,
      },
      {
        value: TYPE.withdraw,
        label: t`Withdraw`,
        activeBarClassName: 'bg-accent',
        content: <TypeTabContent />,
      },
    ];
  }, [t]);

  return (
    <TradeTabs
      className="gap-4"
      listClassName="grid-cols-2"
      value={value}
      onValueChange={onChange}
      options={options}
    />
  );
};

export default TypeTabs;
