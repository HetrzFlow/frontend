import { FC } from 'react';

import { EMPTY_DISPLAY } from '@repo/lib/format';
import { useInstStore } from '@/common';

interface InstProps {
  targetCoin: string;
}

const Inst: FC<InstProps> = ({ targetCoin }) => {
  const insts = useInstStore((state) => state.getInsts());

  return (
    <div className="flex min-w-14 items-center gap-2">
      {insts[targetCoin]?.name || EMPTY_DISPLAY}
    </div>
  );
};

export default Inst;
