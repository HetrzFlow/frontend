import { ReactNode } from 'react';
import { cn } from '@repo/ui';
import {
  RpcStatusBottomIndicator,
  RpcStatusTopAlert,
} from '@/common/containers/rpcStatus';
import AppLayout, { type AppLayoutScrollMode } from '../AppLayout';

interface TradingRouteShellProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  contentClassName?: string;
  rpcTopAlertClassName?: string;
  showRpcStatus?: boolean;
  scrollMode?: AppLayoutScrollMode;
  rounded?: boolean;
  animateInner?: boolean;
}

export default function TradingRouteShell({
  children,
  className,
  innerClassName,
  contentClassName,
  rpcTopAlertClassName,
  showRpcStatus = true,
  scrollMode = 'auto',
  rounded = false,
  animateInner = false,
}: TradingRouteShellProps) {
  return (
    <>
      <AppLayout
        className={className}
        innerClassName={innerClassName}
        scrollMode={scrollMode}
        rounded={rounded}
        animateInner={animateInner}
      >
        <div className="flex h-full min-h-0 flex-col">
          {showRpcStatus ? (
            <RpcStatusTopAlert
              className={cn(
                'mb-1 w-full shrink-0 self-center',
                rpcTopAlertClassName,
              )}
            />
          ) : null}
          <div className={cn('min-h-0 flex-1', contentClassName)}>
            {children}
          </div>
        </div>
      </AppLayout>
      {showRpcStatus ? <RpcStatusBottomIndicator /> : null}
    </>
  );
}
