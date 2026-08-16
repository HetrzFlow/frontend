import { t } from '@lingui/core/macro';
import { CardListIcon, Loading } from '@repo/ui';
import { useNews } from '@/common/services';
import Item from './Item';

const Content = () => {
  const { data, isLoading } = useNews();

  return (
    <div className="flex flex-col text-xs">
      <div className="text-t-1100 mb-3 flex items-center gap-1 text-sm font-medium">
        <CardListIcon size={16} />
        {t`News`}
      </div>
      <div className="scrollbar-none flex h-75 flex-col gap-1 overflow-y-auto">
        {isLoading ? (
          <Loading />
        ) : (
          data?.map((v) => {
            return (
              <Item
                key={v.news_id}
                icon={v.pic}
                message={v.title}
                time={v.create_time}
                link={v.link}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default Content;
