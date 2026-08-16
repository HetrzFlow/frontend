import { useLingui } from '@lingui/react/macro';
import { ConnectBtn } from '@/common';

const NoConnect = () => {
  const { t } = useLingui();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 max-md:mt-6 max-md:gap-2">
      <div className="text-base font-medium max-md:text-sm">{t`Connect your wallet to see all your trades`}</div>
      <ConnectBtn className="max-md:!text-accent w-[220px] max-w-[50vw] text-base underline-offset-2 max-md:size-auto max-md:!bg-transparent max-md:p-0 max-md:text-sm max-md:underline" />
    </div>
  );
};

export default NoConnect;
