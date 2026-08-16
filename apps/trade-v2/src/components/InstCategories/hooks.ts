import { useLingui } from '@lingui/react/macro';
import { getCategoryLabelMessage } from '@/lib/market/categoryLabels';
import { CATEGORY } from '@/services/rest/pools';

export const useInstCategories = ({
  hideNewListed,
  showFavorites = true,
  showCredit = true,
  availableCategories,
}: {
  hideNewListed?: boolean;
  showFavorites?: boolean;
  showCredit?: boolean;
  availableCategories?: ReadonlySet<CATEGORY>;
} = {}) => {
  const { i18n } = useLingui();
  const options = [
    {
      value: CATEGORY.all,
      label: i18n._(getCategoryLabelMessage(CATEGORY.all)),
    },
    ...(showFavorites
      ? [
          {
            value: CATEGORY.favorites,
            label: i18n._(getCategoryLabelMessage(CATEGORY.favorites)),
          },
        ]
      : []),
    {
      value: CATEGORY.forex,
      label: i18n._(getCategoryLabelMessage(CATEGORY.forex)),
    },
    {
      value: CATEGORY.equities,
      label: i18n._(getCategoryLabelMessage(CATEGORY.equities)),
    },
    {
      value: CATEGORY.indices,
      label: i18n._(getCategoryLabelMessage(CATEGORY.indices)),
    },
    {
      value: CATEGORY.crypto,
      label: i18n._(getCategoryLabelMessage(CATEGORY.crypto)),
    },
    {
      value: CATEGORY.commodities,
      label: i18n._(getCategoryLabelMessage(CATEGORY.commodities)),
    },
    {
      value: CATEGORY.memes,
      label: i18n._(getCategoryLabelMessage(CATEGORY.memes)),
    },
    ...(hideNewListed
      ? []
      : [
          {
            value: CATEGORY.newest,
            label: i18n._(getCategoryLabelMessage(CATEGORY.newest)),
          },
        ]),
    ...(showCredit
      ? [
          {
            value: CATEGORY.credit,
            label: i18n._(getCategoryLabelMessage(CATEGORY.credit)),
          },
        ]
      : []),
  ];

  return availableCategories
    ? options.filter(
        (option) =>
          option.value === CATEGORY.all ||
          availableCategories.has(option.value),
      )
    : options;
};
