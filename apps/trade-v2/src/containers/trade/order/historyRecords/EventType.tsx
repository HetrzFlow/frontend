import { FC, ReactNode } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useTradeEventType } from '@/common/hooks/useTradeEventType';

interface EventTypeProps {
  value: string;
  orderType?: string;
}

const EventType: FC<EventTypeProps> = ({ value, orderType }) => {
  const { t } = useLingui();
  const { getLabel, getTone } = useTradeEventType();

  const getOrderTypeLabel = () => {
    switch (orderType) {
      case 'limit':
        return t`Limit`;
      case 'market':
        return t`Market Price`;
      case 'take_profit':
        return t`Take Profit`;
      case 'stop_loss':
        return t`Stop Loss`;
      default:
        return null;
    }
  };

  const orderTypeLabel = orderType ? getOrderTypeLabel() : null;
  const eventLabel = getLabel(value);
  const eventTone = getTone(value);
  const eventClassName = eventTone === 'down' ? 'text-down' : 'text-t-270';

  const renderWithOrderType = (content: ReactNode, className?: string) => {
    if (!orderTypeLabel) {
      return className ? <span className={className}>{content}</span> : content;
    }
    return (
      <span className="flex items-center gap-1">
        <span className="text-t-270">{orderTypeLabel}</span>
        <span className={className}>{content}</span>
      </span>
    );
  };

  return renderWithOrderType(eventLabel, eventClassName);
};

export default EventType;
