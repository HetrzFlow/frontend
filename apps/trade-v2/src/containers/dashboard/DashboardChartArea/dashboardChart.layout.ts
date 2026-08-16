export const DASHBOARD_CHART_STRETCH_TO_CARD_HEIGHT = false;

export const DASHBOARD_CHART_HEIGHT_CLASS_NAME =
  DASHBOARD_CHART_STRETCH_TO_CARD_HEIGHT
    ? 'h-[196px] w-full aspect-auto md:h-full md:min-h-[280px]'
    : 'h-[196px] w-full aspect-auto md:h-[280px]';

export const DASHBOARD_CHART_LOADING_CLASS_NAME =
  DASHBOARD_CHART_STRETCH_TO_CARD_HEIGHT
    ? 'bg-bg-3 h-[196px] animate-pulse rounded-2xl md:h-full md:min-h-[280px]'
    : 'bg-bg-3 h-[196px] animate-pulse rounded-2xl md:h-[280px]';
