import { CoinIcon } from '@repo/common/components';
import { cn } from '@repo/ui';
import { IMAGES_MAP } from '@/common';
import VaultTradeInput, {
  type VaultTradeInputProps,
} from '@/common/components/VaultTradeInput';
import { HZLP_NAME, HZV_NAME, LiqTradeType } from '@/stores/pools/trade';

interface PoolTradeInputProps extends Omit<VaultTradeInputProps, 'isDeposit'> {
  disabledSelector: boolean;
  direction: LiqTradeType;
}

export const TokenSuffix = ({
  image,
  token,
}: {
  image?: string;
  token: string;
}) => (
  <div
    role="button"
    className={cn(
      'pointer-events-none flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium',
      'border',
    )}
  >
    <CoinIcon
      src={
        image || (IMAGES_MAP.coinIcons as Record<string, string>)[token] || ''
      }
      alt={token}
      size={24}
    />
    {token}
  </div>
);

export const HZLP_SUFFIX = () => (
  <TokenSuffix image={IMAGES_MAP.coinIcons.HzLP} token={HZLP_NAME} />
);

export const HZV_SUFFIX = () => (
  <TokenSuffix image={IMAGES_MAP.coinIcons.HzV} token={HZV_NAME} />
);

const PoolTradeInput = ({ direction, ...props }: PoolTradeInputProps) => (
  <VaultTradeInput {...props} isDeposit={direction === LiqTradeType.Deposit} />
);

export default PoolTradeInput;
