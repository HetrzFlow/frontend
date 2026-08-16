import type { PropsWithChildren } from 'react';

const ReferralPageContainer = ({ children }: PropsWithChildren) => {
  return (
    <div className="mx-auto max-w-[1080px] pb-[calc(96px+env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
};

export default ReferralPageContainer;
