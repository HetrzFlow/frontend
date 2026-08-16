import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { EMPTY_DISPLAY } from '@repo/lib/format';

interface EventTypeProps {
  value: string;
  notShowDirection?: boolean;
}

const EventType: FC<EventTypeProps> = ({ value, notShowDirection }) => {
  const { t } = useLingui();
  switch (value) {
    case 'open_long':
      return notShowDirection ? (
        <span className="text-t-270">{t`Open`}</span>
      ) : (
        <span className="text-up">{t`Open Long`}</span>
      );
    case 'close_long':
      return notShowDirection ? (
        <span className="text-t-270">{t`Close`}</span>
      ) : (
        <span className="text-down">{t`Close Long`}</span>
      );
    case 'increase_long':
      return notShowDirection ? (
        <span className="text-t-270">{t`Increase`}</span>
      ) : (
        <span className="text-up">{t`Increase Long`}</span>
      );
    case 'decrease_long':
      return notShowDirection ? (
        <span className="text-t-270">{t`Decrease`}</span>
      ) : (
        <span className="text-down">{t`Decrease Long`}</span>
      );
    case 'open_short':
      return notShowDirection ? (
        <span className="text-t-270">{t`Open`}</span>
      ) : (
        <span className="text-down">{t`Open Short`}</span>
      );
    case 'close_short':
      return notShowDirection ? (
        <span className="text-t-270">{t`Close`}</span>
      ) : (
        <span className="text-up">{t`Close Short`}</span>
      );
    case 'increase_short':
      return notShowDirection ? (
        <span className="text-t-270">{t`Increase`}</span>
      ) : (
        <span className="text-down">{t`Increase Short`}</span>
      );
    case 'decrease_short':
      return notShowDirection ? (
        <span className="text-t-270">{t`Decrease`}</span>
      ) : (
        <span className="text-up">{t`Decrease Short`}</span>
      );
    case 'liquidated':
      return <span className={'text-destructive'}>{t`Liquidated`}</span>;
    default:
      return EMPTY_DISPLAY;
  }
};

export default EventType;
