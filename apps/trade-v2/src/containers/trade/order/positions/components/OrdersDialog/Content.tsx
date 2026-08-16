'use client';

import { FC } from 'react';

import { useCancelOrder } from '@/common';
import Table from '@/components/Table';
import { usePositionOrders } from '@/services/rest/order';
import { useColumns } from './useColumns';

interface ContentProps {
  positionId?: string;
}

const Content: FC<ContentProps> = ({ positionId }) => {
  const { data: orders, refetch } = usePositionOrders(positionId);
  const { mutate: onCancel } = useCancelOrder({ refetchOrders: refetch });
  const columns = useColumns({ onCancel });

  return <Table data={orders} columns={columns} noBorder />;
};

export default Content;
