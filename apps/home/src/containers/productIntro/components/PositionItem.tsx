import { FC } from 'react';
import { percentFormat, thoFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';

interface PositionItemProps {
  symbol: string;
  lever: string;
  value: string;
  pnl: string;
  pnlPercent: string;
  className?: string;
}

const PositionItem: FC<PositionItemProps> = ({
  symbol,
  lever,
  value,
  pnl,
  pnlPercent,
  className,
}) => {
  return (
    <div
      className={cn(
        'mx-3 flex items-center gap-2 rounded-lg p-3 text-sm',
        className,
      )}
    >
      <div className="bg-up h-9 w-[3px] rounded-full"></div>
      <div>
        <div>{symbol}</div>
        <div>{thoFormat(lever)}x</div>
      </div>
      <div className="font-plex ml-auto text-right">
        <div>
          {thoFormat(value, {
            style: 'currency',
            currency: 'USD',
          })}
        </div>
        <div className="text-up">
          {thoFormat(pnl, {
            style: 'currency',
            currency: 'USD',
            signDisplay: 'always',
          })}{' '}
          (
          {percentFormat(pnlPercent, 2, {
            signDisplay: 'always',
          })}
          )
        </div>
      </div>
    </div>
  );
};

export default PositionItem;
