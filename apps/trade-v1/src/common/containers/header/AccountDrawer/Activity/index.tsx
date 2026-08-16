import { FC, memo, useMemo, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import TradeTabs from '../../../../components/TradeTabs';
import HzLP from './HzLP';
import Trade from './Trade';

const Activity: FC = () => {
  const { t } = useLingui();
  const [tabValue, setTabValue] = useState('trade');

  const options = useMemo(() => {
    return [
      {
        value: 'trade',
        label: t`Trade`,
        labelClassName: 'data-[state=active]:text-foreground grow-0 px-6',
        activeBarClassName: '-z-1 h-[32px] bg-bg-5',
        content: <Trade />,
      },
      {
        value: 'hzlp',
        label: t`HzLP`,
        labelClassName: 'data-[state=active]:text-foreground grow-0 px-6',
        activeBarClassName: '-z-1 h-[32px] bg-bg-5',
        content: <HzLP />,
      },
    ];
  }, [t]);

  return (
    <TradeTabs
      value={tabValue}
      options={options}
      className="gap-3"
      listClassName="flex justify-start mx-6 px-0 rounded-none "
      onValueChange={setTabValue}
    />
  );
};

export default memo(Activity);
