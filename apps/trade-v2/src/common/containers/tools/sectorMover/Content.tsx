import { t } from '@lingui/core/macro';
import { BubbleIcon } from '@repo/ui';
import Chart from './Chart';

const Content = () => {
  return (
    <div className="flex flex-col text-xs">
      <div className="text-t-1100 mb-2.5 flex items-center gap-1 text-sm font-medium">
        <BubbleIcon size={16} />
        {t`Sector Mover`}
      </div>
      <Chart />
    </div>
  );
};

export default Content;
