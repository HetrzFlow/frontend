import { ReferralClientLoadingShell } from '@/containers/referral/ReferralLoadingShell';
import ReferralPageContainer from '@/containers/referral/ReferralPageContainer';

export default function Loading() {
  return (
    <ReferralPageContainer>
      <ReferralClientLoadingShell />
    </ReferralPageContainer>
  );
}
