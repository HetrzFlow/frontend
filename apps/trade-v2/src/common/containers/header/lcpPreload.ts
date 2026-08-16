import { preload } from 'react-dom';

export const LCP_IMAGE_SRC = '/trade-static/lcp-ele.svg';

export function registerLcpPreload() {
  preload(LCP_IMAGE_SRC, { as: 'image', fetchPriority: 'high' });
}
