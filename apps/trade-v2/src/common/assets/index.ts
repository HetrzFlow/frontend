import { IMAGES_MAP as COMMON_IMAGES_MAP } from '@repo/common';

import Step1Dark from './onboarding/step1-dark.png';
import Step2Dark from './onboarding/step2-dark.png';
import Step3Dark from './onboarding/step3-dark.png';

export const IMAGES_MAP = {
  ...COMMON_IMAGES_MAP,
  steps: {
    1: Step1Dark,
    2: Step2Dark,
    3: Step3Dark,
  },
};
