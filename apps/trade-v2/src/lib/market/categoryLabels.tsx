import { msg } from '@lingui/core/macro';
import { CATEGORY } from '@/services/rest/pools';
import type { MessageDescriptor } from '@lingui/core';

const CATEGORY_LABEL_MESSAGES = {
  [CATEGORY.all]: msg`All`,
  [CATEGORY.favorites]: msg`Favorites`,
  [CATEGORY.crypto]: msg`Crypto`,
  [CATEGORY.forex]: msg`Forex`,
  [CATEGORY.equities]: msg`Equities`,
  [CATEGORY.indices]: msg`Indices`,
  [CATEGORY.commodities]: msg`Commodities`,
  [CATEGORY.memes]: msg`Meme`,
  [CATEGORY.newest]: msg`Newly Listed`,
  [CATEGORY.credit]: msg`Credit`,
};

export function getCategoryLabelMessage(category: CATEGORY): MessageDescriptor;
export function getCategoryLabelMessage(
  category?: CATEGORY,
): MessageDescriptor | undefined;
export function getCategoryLabelMessage(category?: CATEGORY) {
  return category ? CATEGORY_LABEL_MESSAGES[category] : undefined;
}
