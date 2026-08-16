import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { BullseyeIcon } from '@repo/ui';
import Categories from './Categories';
import List from './List';

const Content = () => {
  const [category, setCategory] = useState('a16z');
  return (
    <div className="flex w-full flex-col gap-3 overflow-hidden text-xs">
      <div className="text-t-1100 flex items-center gap-1 text-sm font-medium">
        <BullseyeIcon size={16} />
        {t`Portfolio Tracker`}
      </div>

      <Categories value={category} onChange={setCategory} />

      <List category={category} />
    </div>
  );
};

export default Content;
