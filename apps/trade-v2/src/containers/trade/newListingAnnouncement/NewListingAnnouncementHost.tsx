'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavItems } from '@repo/common/hooks';
import { useInstStore } from '@/common';
import { useNewListingAnnouncements } from '@/common/services';
import { useAppUiStore } from '@/common/stores';
import { usePreferenceStore } from '@/stores/trade/preference';
import { mapVisibleAnnouncements } from './mapper';
import NewListingAnnouncementToast from './NewListingAnnouncementToast';

const ANNOUNCEMENT_CLOSE_ANIMATION_MS = 220;

const NewListingAnnouncementHost = () => {
  const { trade } = useNavItems();
  const instMap = useInstStore((state) => state.getInsts());
  const { data: announcements = [] } = useNewListingAnnouncements();
  const dismissedAnnouncementRecords = usePreferenceStore(
    (state) => state.dismissedAnnouncementRecords,
  );
  const addDismissedAnnouncementRecord = usePreferenceStore(
    (state) => state.addDismissedAnnouncementRecord,
  );
  const pruneDismissedAnnouncementRecords = usePreferenceStore(
    (state) => state.pruneDismissedAnnouncementRecords,
  );
  const setAnnouncementStackHeight = useAppUiStore(
    (state) => state.setAnnouncementStackHeight,
  );
  const [closingAnnouncementIds, setClosingAnnouncementIds] = useState<
    string[]
  >([]);
  const closeTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const stackRef = useRef<HTMLDivElement | null>(null);
  const dismissedIds = useMemo(
    () => dismissedAnnouncementRecords.map((item) => item.createdAt),
    [dismissedAnnouncementRecords],
  );

  useEffect(() => {
    pruneDismissedAnnouncementRecords();

    const pruneIntervalId = setInterval(() => {
      pruneDismissedAnnouncementRecords();
    }, 300_000);

    return () => {
      clearInterval(pruneIntervalId);
    };
  }, [pruneDismissedAnnouncementRecords]);

  const visibleAnnouncements = useMemo(
    () =>
      mapVisibleAnnouncements({
        announcements,
        dismissedCreatedAts: dismissedIds,
        instMap,
        now: Date.now(),
      }),
    [announcements, dismissedIds, instMap],
  );

  const renderedAnnouncements = useMemo(
    () =>
      visibleAnnouncements.filter(
        (announcement) => !dismissedIds.includes(announcement.createdAt),
      ),
    [dismissedIds, visibleAnnouncements],
  );

  useLayoutEffect(() => {
    if (!stackRef.current) {
      setAnnouncementStackHeight(0);
      return;
    }

    const nextHeight = stackRef.current.getBoundingClientRect().height;
    setAnnouncementStackHeight(Math.ceil(nextHeight));
  }, [renderedAnnouncements, setAnnouncementStackHeight]);

  useEffect(() => {
    const closeTimeouts = closeTimeoutsRef.current;

    return () => {
      Object.values(closeTimeouts).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      setAnnouncementStackHeight(0);
    };
  }, [setAnnouncementStackHeight]);

  if (renderedAnnouncements.length === 0) {
    return null;
  }

  return (
    <div
      ref={stackRef}
      className="pointer-events-none fixed right-3 bottom-12 z-40 flex flex-col gap-3 max-md:right-1/2 max-md:bottom-[144px] max-md:translate-x-1/2"
    >
      {renderedAnnouncements.map((announcement) => {
        const isClosing = closingAnnouncementIds.includes(announcement.toastId);

        return (
          <div
            key={announcement.toastId}
            className="pointer-events-auto transition-all duration-200 ease-out"
            style={{
              opacity: isClosing ? 0 : 1,
              transform: isClosing
                ? 'translateY(8px) scale(0.98)'
                : 'translateY(0) scale(1)',
            }}
          >
            <NewListingAnnouncementToast
              totalMarkets={announcement.totalMarkets}
              overflowCount={announcement.overflowCount}
              markets={announcement.visibleMarkets}
              onClose={() => {
                if (closingAnnouncementIds.includes(announcement.toastId)) {
                  return;
                }

                setClosingAnnouncementIds((current) => [
                  ...current,
                  announcement.toastId,
                ]);

                closeTimeoutsRef.current[announcement.toastId] = setTimeout(
                  () => {
                    addDismissedAnnouncementRecord(
                      announcement.createdAt,
                      announcement.expireAt,
                    );
                    setClosingAnnouncementIds((current) =>
                      current.filter((id) => id !== announcement.toastId),
                    );
                    delete closeTimeoutsRef.current[announcement.toastId];
                  },
                  ANNOUNCEMENT_CLOSE_ANIMATION_MS,
                );
              }}
              tradeLink={trade.link}
            />
          </div>
        );
      })}
    </div>
  );
};

export default NewListingAnnouncementHost;
