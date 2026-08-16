import { useFormatDistanceToNow } from '@/hooks/useDateFormat';
import { useNow } from '@/hooks/useNow';

const TIME_REFRESH_INTERVAL = 5_000;

interface TimeProps {
  value: number;
}

const Time = ({ value }: TimeProps) => {
  const timeNow = useNow(TIME_REFRESH_INTERVAL);

  const timeText = useFormatDistanceToNow(value, timeNow);
  return <span className="text-t-350 w-1/3 text-right">{timeText}</span>;
};

export default Time;
