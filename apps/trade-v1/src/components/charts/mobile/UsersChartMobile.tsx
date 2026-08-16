'use client';

import { useUsersChartData } from '@/hooks/useUsersChartData';
import { UsersChartPresenterMobile } from './UsersChartPresenterMobile';

interface UsersChartMobileProps {
  className?: string;
  height?: number;
}

const UsersChartMobileContainer = ({
  className,
  height,
}: UsersChartMobileProps) => {
  const { data, isLoading, error } = useUsersChartData();

  return (
    <UsersChartPresenterMobile
      data={data}
      isLoading={isLoading}
      error={error}
      className={className}
      height={height}
    />
  );
};

UsersChartMobileContainer.displayName = 'UsersChartMobileContainer';

export { UsersChartMobileContainer as UsersChartMobile };
