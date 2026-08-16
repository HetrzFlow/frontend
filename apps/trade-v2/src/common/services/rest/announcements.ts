import { useQuery } from '@repo/lib/queryClient';
import { get } from '@repo/lib/rest';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import type { AnnouncementApiItem } from '@/containers/trade/newListingAnnouncement/mapper';

const SUCCESS_CODE = 200;

export interface AnnouncementsApiResponse {
  code?: number;
  error?: string;
  message?: string;
  msg?: string;
  data?: {
    announcements?: AnnouncementApiItem[];
  };
}

export const extractAnnouncements = (
  response: AnnouncementsApiResponse,
): AnnouncementApiItem[] => {
  if (response.error) {
    return [];
  }

  if (response.code !== undefined && response.code !== SUCCESS_CODE) {
    return [];
  }

  return Array.isArray(response.data?.announcements)
    ? response.data.announcements
    : [];
};

export const useNewListingAnnouncements = () => {
  return useQuery<AnnouncementApiItem[]>({
    queryKey: ['rest', 'new-listing-announcements'],
    queryFn: async () => {
      const response = await get<AnnouncementsApiResponse>(
        `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/announcements`,
      );

      return extractAnnouncements(response);
    },
    refetchInterval: 300_000,
    retry: false,
  });
};
