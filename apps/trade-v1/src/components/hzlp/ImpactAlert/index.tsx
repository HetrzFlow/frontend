import { FC, memo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Alert, AlertDescription } from '@repo/ui';

interface ImpactAlertProps {
  isHighPriceImpact: boolean;
  isHighImpactOnWeightage: boolean;
  displayPriceImpact: string;
  displayImpactOnWeightage: string;
}

const ImpactAlert: FC<ImpactAlertProps> = ({
  isHighPriceImpact,
  isHighImpactOnWeightage,
  displayPriceImpact,
  displayImpactOnWeightage,
}) => {
  const [showAlert, setShowAlert] = useState(true);
  const { t } = useLingui();

  if (!isHighPriceImpact && !isHighImpactOnWeightage) {
    return null;
  }

  return (
    <Alert open={showAlert} onOpenChange={setShowAlert} className="mt-4">
      <AlertDescription>
        {isHighPriceImpact && (
          <span>{t`High Price Impact: ${displayPriceImpact}`}</span>
        )}
        {isHighImpactOnWeightage && (
          <span>
            {t`High Swap Impact on Weightage: ${displayImpactOnWeightage}`}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default memo(ImpactAlert);
