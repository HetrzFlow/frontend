import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { Button, Label, Switch } from '@repo/ui';
import { useKlineStore } from '@/stores/trade/kline';
import { useOrdersStore } from '../store';

interface OperationsProps {
  onCloseAll?: () => void;
  onCancelAll?: () => void;
  count?: number;
}

const Operations: FC<OperationsProps> = ({
  onCancelAll,
  onCloseAll,
  count = 0,
}) => {
  const { t } = useLingui();
  const [showPositions, setShowPositions] = useKlineStore(
    useShallow((state) => [state.showPositions, state.setShowPositions]),
  );
  const [onlyShowCurrentInst, setOnlyShowCurrentInst] = useOrdersStore(
    useShallow((state) => [
      state.onlyShowCurrentInst,
      state.setOnlyShowCurrentInst,
    ]),
  );
  return (
    <div className="bg-background flex items-center gap-3 border-b px-4 py-3">
      <Label className="text-t-270 z-1 flex shrink-0 cursor-pointer items-center gap-2 font-normal">
        {t`Chart Positions`}
        <Switch
          aria-label={t`Chart Positions`}
          checked={showPositions}
          onCheckedChange={(checked) => setShowPositions(checked)}
        />
      </Label>
      <Label className="text-t-270 z-1 flex shrink-0 cursor-pointer items-center gap-2 font-normal">
        {t`Hide Others`}
        <Switch
          aria-label={t`Hide Others`}
          checked={onlyShowCurrentInst}
          onCheckedChange={(checked) => setOnlyShowCurrentInst(checked)}
        />
      </Label>
      <div className="ml-auto flex h-4 items-center">
        {onCloseAll && (
          <Button
            variant="link"
            size="sm"
            disabled={!count}
            className="p-0 hover:no-underline"
            onClick={onCloseAll}
          >
            {t`Close all`}
          </Button>
        )}
        {onCancelAll && (
          <Button
            variant="link"
            size="sm"
            disabled={!count}
            className="p-0 hover:no-underline"
            onClick={onCancelAll}
          >
            {count ? t`Cancel all (${count})` : t`Cancel all`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Operations;
