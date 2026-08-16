'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { createPortal } from 'react-dom';
import { Alert, AlertDescription, cn } from '@repo/ui';
import { useHzSdk } from '@/common/chainClient/hooks';
import PointMarker from '@/common/components/PointMarker';
import { measureEvmRpcLatency } from '@/common/services/rest/rpc';

type RPCStatus = 'healthy' | 'warning' | 'offline';

const WARNING_THRESHOLD = 3000;
const CONSECUTIVE_FAILURES_THRESHOLD = 2;
const CONSECUTIVE_SLOW_THRESHOLD = 2;
const CONSECUTIVE_SUCCESS_THRESHOLD = 2;
const RPC_STATUS_CHECK_INTERVAL = 10_000;

interface RpcStatusProps {
  className?: string;
}

type RpcStatusTopAlertViewProps = {
  status: RPCStatus;
  warningMessage: string;
  offlineMessage: string;
  className?: string;
  showClose?: boolean;
};

type RpcStatusBottomIndicatorViewProps = {
  status: RPCStatus;
  className?: string;
};

export type RpcStatusTopAlertProps = {
  className?: string;
  showClose?: boolean;
};

export type RpcStatusBottomIndicatorProps = {
  className?: string;
};

const statusMap: Record<RPCStatus, 'success' | 'failed' | 'warning'> = {
  healthy: 'success',
  warning: 'warning',
  offline: 'failed',
};

const getIndicatorConfig = (status: RPCStatus) => {
  switch (status) {
    case 'healthy':
      return {
        label: 'Online',
        colorClass: 'text-green',
      };
    case 'warning':
      return {
        label: 'Degraded',
        colorClass: 'text-warning',
      };
    case 'offline':
      return {
        label: 'Offline',
        colorClass: 'text-destructive',
      };
  }
};

const useRpcStatusState = () => {
  const hzSdk = useHzSdk();
  const [status, setStatus] = useState<RPCStatus>('healthy');
  const statusRef = useRef<RPCStatus>('healthy');
  const consecutiveFailuresRef = useRef(0);
  const consecutiveSuccessesRef = useRef(0);
  const consecutiveSlowRequestsRef = useRef(0);

  useEffect(() => {
    if (!hzSdk) return;

    let latestCheckId = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const setRpcStatus = (nextStatus: RPCStatus) => {
      if (statusRef.current === nextStatus) return;

      statusRef.current = nextStatus;
      setStatus(nextStatus);
    };

    const handleLatency = (latency: number) => {
      consecutiveFailuresRef.current = 0;

      if (statusRef.current === 'offline') {
        consecutiveSlowRequestsRef.current = CONSECUTIVE_SLOW_THRESHOLD;
        consecutiveSuccessesRef.current = CONSECUTIVE_SUCCESS_THRESHOLD;
      }

      if (latency > WARNING_THRESHOLD) {
        consecutiveSlowRequestsRef.current += 1;
        consecutiveSuccessesRef.current = 0;

        if (consecutiveSlowRequestsRef.current >= CONSECUTIVE_SLOW_THRESHOLD) {
          setRpcStatus('warning');
        }

        return;
      }

      consecutiveSlowRequestsRef.current = 0;
      consecutiveSuccessesRef.current += 1;

      if (consecutiveSuccessesRef.current >= CONSECUTIVE_SUCCESS_THRESHOLD) {
        setRpcStatus('healthy');
      }
    };

    const handleFailure = () => {
      consecutiveFailuresRef.current += 1;
      consecutiveSuccessesRef.current = 0;
      consecutiveSlowRequestsRef.current = 0;

      if (consecutiveFailuresRef.current >= CONSECUTIVE_FAILURES_THRESHOLD) {
        setRpcStatus('offline');
      }
    };

    const checkRpcStatus = async () => {
      const checkId = ++latestCheckId;

      try {
        const latency = await measureEvmRpcLatency(hzSdk);
        if (checkId !== latestCheckId) return;

        handleLatency(latency);
      } catch {
        if (checkId !== latestCheckId) return;

        handleFailure();
      }
    };

    const checkVisibleRpcStatus = () => {
      if (document.visibilityState !== 'visible') return;

      checkRpcStatus();
    };

    const stopPolling = () => {
      if (!intervalId) return;

      clearInterval(intervalId);
      intervalId = undefined;
    };

    const startPolling = () => {
      if (document.visibilityState !== 'visible' || intervalId) return;

      intervalId = setInterval(checkRpcStatus, RPC_STATUS_CHECK_INTERVAL);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVisibleRpcStatus();
        startPolling();
        return;
      }

      stopPolling();
    };

    window.addEventListener('offline', checkVisibleRpcStatus);
    window.addEventListener('online', checkVisibleRpcStatus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (document.visibilityState === 'visible') {
      checkVisibleRpcStatus();
      startPolling();
    }

    return () => {
      latestCheckId += 1;
      stopPolling();
      window.removeEventListener('offline', checkVisibleRpcStatus);
      window.removeEventListener('online', checkVisibleRpcStatus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hzSdk]);

  return status;
};

const RpcStatusTopAlertView: FC<RpcStatusTopAlertViewProps> = ({
  status,
  warningMessage,
  offlineMessage,
  className,
  showClose = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(true);
  }, [status]);

  if (status === 'healthy') return null;

  return (
    <div className={cn('shrink-0 px-0', className)}>
      <Alert
        open={isOpen}
        showClose={showClose}
        onOpenChange={setIsOpen}
        variant={status === 'offline' ? 'destructive' : 'default'}
        className="!grid-cols-[1fr_calc(var(--spacing)*5)] py-2"
        icon={<></>}
      >
        <AlertDescription className="col-start-1 text-xs">
          {status === 'warning' ? warningMessage : offlineMessage}
        </AlertDescription>
      </Alert>
    </div>
  );
};

const RpcStatusBottomIndicatorView: FC<RpcStatusBottomIndicatorViewProps> = ({
  status,
  className,
}) => {
  const config = useMemo(() => getIndicatorConfig(status), [status]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <div
      className={cn(
        'fixed bottom-2.5 left-4 z-50 flex h-5 items-center gap-1 rounded-sm px-2 py-0.5 font-medium max-md:hidden',
        className,
      )}
    >
      <PointMarker status={statusMap[status]} />
      <span className={cn('text-[10px]', config.colorClass)}>
        {config.label}
      </span>
    </div>,
    portalTarget,
  );
};

export const RpcStatusTopAlert: FC<RpcStatusTopAlertProps> = ({
  className,
  showClose = false,
}) => {
  const { t } = useLingui();
  const status = useRpcStatusState();
  return (
    <RpcStatusTopAlertView
      status={status}
      className={className}
      showClose={showClose}
      warningMessage={t`Network experiencing delays. Please proceed with caution.`}
      offlineMessage={t`Network connection lost. Please check your connection and try again.`}
    />
  );
};

export const RpcStatusBottomIndicator: FC<RpcStatusBottomIndicatorProps> = ({
  className,
}) => {
  const status = useRpcStatusState();
  return <RpcStatusBottomIndicatorView status={status} className={className} />;
};

const RpcStatus: FC<RpcStatusProps> = ({ className }) => {
  const { t } = useLingui();
  const status = useRpcStatusState();

  return (
    <>
      <RpcStatusTopAlertView
        status={status}
        className={className}
        warningMessage={t`Network experiencing delays. Please proceed with caution.`}
        offlineMessage={t`Network connection lost. Please check your connection and try again.`}
      />
      <RpcStatusBottomIndicatorView status={status} />
    </>
  );
};

export default RpcStatus;
