'use client';

import { useUsersChartData } from '@/hooks/useUsersChartData';
import { UsersChartPresenter } from './UsersChartPresenter';

interface UsersChartProps {
  className?: string;
  height?: number;
}

const UsersChartContainer = ({ className, height }: UsersChartProps) => {
  const { data, isLoading, error } = useUsersChartData();

  return (
    <UsersChartPresenter
      data={data}
      isLoading={isLoading}
      error={error}
      className={className}
      height={height}
    />
  );
};

UsersChartContainer.displayName = 'UsersChartContainer';

export { UsersChartContainer as UsersChart };
