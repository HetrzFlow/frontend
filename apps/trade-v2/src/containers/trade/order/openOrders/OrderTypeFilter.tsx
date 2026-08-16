import { FC } from 'react';

import Filter from '../components/Filter';
import { useOrderTypeFilter } from './useOrderTypeFilter';

interface OrderTypeFilterProps {
  showLabel?: boolean;
}

const OrderTypeFilter: FC<OrderTypeFilterProps> = ({ showLabel = true }) => {
  const { label, value, options, onValueChange } = useOrderTypeFilter();

  return (
    <Filter
      label={showLabel ? label : null}
      value={value}
      options={options}
      onValueChange={onValueChange}
    />
  );
};

export default OrderTypeFilter;
