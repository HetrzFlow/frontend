import { useLingui } from '@lingui/react/macro';
import Table from '@/components/Table';
import { vaultListColumns, type VaultListRow } from './vaultListColumns';

type Props = {
  data: VaultListRow[];
};

export default function VaultsListView({ data }: Props) {
  const { t } = useLingui();

  return (
    <div className="bg-bg-card-mix mt-3 rounded-2xl p-2">
      <Table
        columns={vaultListColumns}
        data={data}
        noBorder
        disableShadow
        bodyCellClassName="py-1"
        equalColumns
        outerClassName="h-auto"
        wrapClassName="h-auto overflow-visible pb-0"
        emptyMessage={t`No matching results found.`}
      />
    </div>
  );
}
