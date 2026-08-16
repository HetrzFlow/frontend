import { tailwindConfig } from '@repo/configs/stylelint';

export default {
  ...tailwindConfig,
  rules: {
    ...tailwindConfig.rules,
    'alpha-value-notation': 'number',
    'color-function-notation': 'legacy',
    'property-no-vendor-prefix': [
      true,
      {
        ignoreProperties: ['-webkit-backdrop-filter'],
      },
    ],
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
  },
};
