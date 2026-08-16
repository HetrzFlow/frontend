import { FC, ReactNode } from 'react';
import { useLingui } from '@lingui/react/macro';

import { ChevronLeftIcon, cn } from '@repo/ui';

const PanelLayout: FC<{
  onBack?: () => void;
  children: ReactNode;
  disabledInAnimation?: boolean;
  close: boolean;
  className?: string;
  showBack?: boolean;
}> = ({
  close,
  onBack,
  children,
  disabledInAnimation,
  className,
  showBack = true,
}) => {
  const { t } = useLingui();

  return (
    <div
      className={cn(
        'flex flex-col gap-3 text-xs transition-none duration-300',
        className,
        disabledInAnimation ? '' : 'animate-in slide-in-from-right-2 fade-in',
        close ? 'animate-out slide-out-to-left-2 fade-out' : '',
      )}
    >
      {showBack && (
        <div
          className="hover:text-t-1100 text-t-350 flex cursor-pointer items-center gap-1 transition-colors"
          onClick={onBack}
        >
          <ChevronLeftIcon />
          {t`Back`}
        </div>
      )}
      {children}
    </div>
  );
};

export default PanelLayout;
