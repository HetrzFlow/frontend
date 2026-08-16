import { useQuery } from '@repo/lib/queryClient';
import { get } from '@repo/lib/rest';
import { toast } from '@repo/ui';
import { IMAGES_MAP } from '../../assets';
import { DATA_STAT_API_BASE_URL } from './const';

interface NewsRes {
  error?: string;
  data: {
    items: {
      news_id: string;
      title: string;
      content: string;
      pic: string;
      link: string;
      url: string;
      create_time: number;
    }[];
  };
}

// query news data
export const useNews = () => {
  return useQuery({
    queryKey: ['rest', 'news'],
    queryFn: async () => {
      const { error, data } = await get<NewsRes>(
        `${DATA_STAT_API_BASE_URL}/v1/news/feeds`,
      );
      if (error) {
        toast.error(error, { id: 'rest-news' });
        throw new Error(error);
      }

      return (data?.items || []).map((v, i) => {
        v.pic = IMAGES_MAP.news[i % IMAGES_MAP.news.length]!;
        return v;
      });
    },
    refetchInterval: 60000,
  });
};
