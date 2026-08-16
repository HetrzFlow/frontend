import { useId } from 'react';
import { useLingui } from '@lingui/react/macro';
import { cn } from '@repo/ui';
import ConnectBtn from '../ConnectBtn';

interface WalletConnectEmptyStateProps {
  message?: string;
  className?: string;
}

const WalletConnectEmptyState = ({
  message,
  className,
}: WalletConnectEmptyStateProps) => {
  const { t } = useLingui();
  const gradientBaseId = useId().replace(/:/g, '');
  const gradientId = (index: number) =>
    `wallet-connect-empty-${gradientBaseId}-${index}`;

  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center gap-3 max-md:mt-6 max-md:h-max max-md:gap-2',
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="38"
        viewBox="0 0 50 38"
        fill="none"
        className="text-accent shrink-0"
      >
        <rect
          x="0.291714"
          y="0.505263"
          width="22.9053"
          height="19.5368"
          rx="2.35789"
          transform="matrix(0.866025 0.5 -2.20305e-08 1 21.8867 5.85414)"
          fill={`url(#${gradientId(0)})`}
          stroke={`url(#${gradientId(1)})`}
          strokeWidth="0.673684"
        />
        <rect
          x="0.291714"
          y="0.505263"
          width="22.9053"
          height="19.5368"
          rx="2.35789"
          transform="matrix(0.866025 0.5 -2.20305e-08 1 29.2774 5.85414)"
          fill={`url(#${gradientId(2)})`}
          stroke={`url(#${gradientId(3)})`}
          strokeWidth="0.673684"
        />
        <rect
          x="0.291714"
          y="0.505263"
          width="22.9053"
          height="19.5368"
          rx="2.35789"
          transform="matrix(0.866025 0.5 -2.20305e-08 1 15.168 -0.145857)"
          fill={`url(#${gradientId(4)})`}
          stroke={`url(#${gradientId(5)})`}
          strokeWidth="0.673684"
        />
        <rect
          x="0.291714"
          y="0.505263"
          width="22.9053"
          height="19.5368"
          rx="2.35789"
          transform="matrix(0.866025 0.5 -2.20305e-08 1 7.77736 5.85414)"
          fill={`url(#${gradientId(6)})`}
          stroke={`url(#${gradientId(7)})`}
          strokeWidth="0.673684"
        />
        <rect
          x="0.291714"
          y="0.505263"
          width="22.9053"
          height="19.5368"
          rx="2.35789"
          transform="matrix(0.866025 0.5 -2.20305e-08 1 0.386739 5.85414)"
          fill={`url(#${gradientId(8)})`}
          stroke={`url(#${gradientId(9)})`}
          strokeWidth="0.673684"
        />
        <defs>
          <linearGradient
            id={gradientId(0)}
            x1="11.7895"
            y1="0"
            x2="11.7895"
            y2="20.2105"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient
            id={gradientId(1)}
            x1="11.7895"
            y1="0"
            x2="11.7895"
            y2="20.2105"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.1" />
            <stop offset="1" stopColor="white" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient
            id={gradientId(2)}
            x1="11.7895"
            y1="0"
            x2="11.7895"
            y2="20.2105"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient
            id={gradientId(3)}
            x1="11.7895"
            y1="0"
            x2="11.7895"
            y2="20.2105"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.1" />
            <stop offset="1" stopColor="white" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient
            id={gradientId(4)}
            x1="11.7895"
            y1="0"
            x2="11.7895"
            y2="20.2105"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient
            id={gradientId(5)}
            x1="11.7895"
            y1="0"
            x2="11.7895"
            y2="20.2105"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.1" />
            <stop offset="1" stopColor="white" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient
            id={gradientId(6)}
            x1="11.7895"
            y1="0"
            x2="11.7895"
            y2="20.2105"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient
            id={gradientId(7)}
            x1="11.7895"
            y1="0"
            x2="11.7895"
            y2="20.2105"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.1" />
            <stop offset="1" stopColor="white" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient
            id={gradientId(8)}
            x1="11.7895"
            y1="0"
            x2="11.7895"
            y2="20.2105"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient
            id={gradientId(9)}
            x1="11.7895"
            y1="0"
            x2="11.7895"
            y2="20.2105"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.1" />
            <stop offset="1" stopColor="white" stopOpacity="0.03" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center text-sm font-medium max-md:text-sm">
        {message ?? t`Connect your wallet to see all your trades`}
      </div>
      <ConnectBtn
        size="lg"
        className="max-md:!text-accent w-[200px] max-w-[50vw] text-xs underline-offset-2 max-md:size-auto max-md:!bg-transparent max-md:p-0 max-md:text-sm max-md:underline"
      />
    </div>
  );
};

export default WalletConnectEmptyState;
