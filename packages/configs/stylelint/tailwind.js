import base from "./base.js";

export default {
  extends: [base],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "apply",
          "layer",
          "responsive",
          "screen",
          "tailwind",
          "variants",
          "source",
          "plugin",
          "custom-variant",
          "theme",
          "utility",
        ],
      },
    ],
    "at-rule-no-deprecated": [
      true,
      {
        ignoreAtRules: ["apply"],
      },
    ],
    "import-notation": null,
    "selector-class-pattern": null,
  },
};
