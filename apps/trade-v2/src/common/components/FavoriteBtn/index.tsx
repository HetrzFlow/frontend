import { FC } from 'react';
import { cn, StarIcon } from '@repo/ui';

interface FavoriteBtnProps {
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const FavoriteBtn: FC<FavoriteBtnProps> = ({
  isFavorite,
  onToggle,
  className,
  onClick,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center transition-colors duration-200',
        'hover:text-accent',
        isFavorite ? 'text-accent' : 'text-t-430',
        className,
      )}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <StarIcon filled={isFavorite} size={14} />
    </button>
  );
};

export default FavoriteBtn;
