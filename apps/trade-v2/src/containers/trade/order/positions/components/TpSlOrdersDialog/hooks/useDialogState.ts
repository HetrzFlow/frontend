import { useCallback, useState } from 'react';

import type { Order } from '@/common/services';

import type { TpSlSizeFilter, TpSlTab } from '../TabFilter';

type DisplayUnit = '%' | '$';

export const useTpSlOrdersDialogState = () => {
  const [activeTab, setActiveTab] = useState<TpSlTab>('tp');
  const [sizeFilter, setSizeFilter] = useState<TpSlSizeFilter>('partial');
  const [sizeDisplayUnit, setSizeDisplayUnit] = useState<DisplayUnit>('$');
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleEdit = useCallback((order: Order) => {
    setEditOrder(order);
    setEditDialogOpen(true);
  }, []);

  const handleEditDialogOpenChange = useCallback((open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setEditOrder(null);
    }
  }, []);

  const handleAddTpSl = useCallback(() => {
    setAddDialogOpen(true);
  }, []);

  const toggleSizeDisplayUnit = useCallback(() => {
    setSizeDisplayUnit((prev) => (prev === '%' ? '$' : '%'));
  }, []);

  return {
    activeTab,
    setActiveTab,
    sizeFilter,
    setSizeFilter,
    sizeDisplayUnit,
    editOrder,
    editDialogOpen,
    addDialogOpen,
    setAddDialogOpen,
    handleEdit,
    handleEditDialogOpenChange,
    handleAddTpSl,
    toggleSizeDisplayUnit,
  };
};
