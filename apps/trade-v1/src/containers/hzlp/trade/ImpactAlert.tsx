import { FC } from 'react';
import ImpactAlert from '@/components/hzlp/ImpactAlert';
import { useImpactAlertData } from '@/hooks/hzlp/useImpactAlertData';

const ImpactAlertContainer: FC = () => {
  const impactData = useImpactAlertData();

  return <ImpactAlert {...impactData} />;
};

export default ImpactAlertContainer;
