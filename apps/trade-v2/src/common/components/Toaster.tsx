'use client';

import { Toaster, useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import { useAppUiStore } from '@/common/stores';

const BASE_TOAST_BOTTOM_OFFSET = 48;
const ANNOUNCEMENT_STACK_GAP = 12;

const ToasterCus: React.FC = () => {
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const position = isMobile ? 'top-center' : 'bottom-right';
  const announcementStackHeight = useAppUiStore(
    (state) => state.announcementStackHeight,
  );
  const bottomOffset =
    BASE_TOAST_BOTTOM_OFFSET +
    (announcementStackHeight > 0
      ? announcementStackHeight + ANNOUNCEMENT_STACK_GAP
      : 0);

  return (
    <>
      <Toaster
        position={position}
        // mobile: 1; PC:3
        visibleToasts={isMobile ? 2 : 3}
        theme="dark"
        expand
        offset={{ bottom: bottomOffset, top: 40, right: 12 }}
      />
      {/* not closed toast */}
      <Toaster
        id="permanent-toast"
        position={position}
        visibleToasts={1}
        theme="dark"
      />
    </>
  );
};

export default ToasterCus;
