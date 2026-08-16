import { FC } from 'react';
import { cn, Skeleton, WalletIcon } from '@repo/ui';

interface AvatarProps {
  size?: number;
  className?: string;
  icon?: string;
  loading?: boolean;
  meta?: {
    name: string;
    id: string;
    icon?: string;
  };
}

const bitgetWalletIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSIjMDAxRjI5Ii8+CjxwYXRoIGQ9Ik0yMTkuOTQ4IDk1LjcwMjJDMjAxLjYyMyA5NS42OTI5IDE4My4zMyA5NS42ODM1IDE2NC45NDEgOTUuNzExNkMxNTMuODIyIDk1LjcxMTYgMTQ5LjY1MSAxMDkuNjcxIDE1Ny45MjEgMTE3LjkzOUwyODMuMDk4IDI0My4xMTdDMjg3LjAwNCAyNDYuNjkgMjg5LjQ0MSAyNTAuNTc0IDI4OS41MyAyNTUuNjkzQzI4OS40NDEgMjYwLjgxMiAyODcuMDA0IDI2NC42OTYgMjgzLjA5OCAyNjguMjY5TDE1Ny45MjEgMzkzLjQ0NkMxNDkuNjUxIDQwMS43MTUgMTUzLjgyMiA0MTUuNjc0IDE2NC45NDEgNDE1LjY3NEMxODMuMzMgNDE1LjcwMiAyMDEuNjIzIDQxNS42OTMgMjE5Ljk0OCA0MTUuNjgzQzIyOS4xMjIgNDE1LjY3OSAyMzguMzA1IDQxNS42NzQgMjQ3LjUxMSA0MTUuNjc0QzI1OS41NTUgNDE1LjY3NCAyNjYuNzIgNDA5LjI0IDI3My4xNTQgNDAyLjgwNUwzODYuMDQ3IDI4OS45MTJDMzk1LjA1NyAyODAuOTAyIDQwMy4xMTkgMjY4LjkzOSA0MDMuMDA5IDI1NS42OTNDNDAzLjExOSAyNDIuNDQ3IDM5NS4wNTcgMjMwLjQ4NCAzODYuMDQ3IDIyMS40NzRMMjczLjE1NCAxMDguNThDMjY2LjcyIDEwMi4xNDYgMjU5LjU1NSA5NS43MTE2IDI0Ny41MTEgOTUuNzExNkMyMzguMzA1IDk1LjcxMTYgMjI5LjEyMiA5NS43MDY5IDIxOS45NDggOTUuNzAyMloiIGZpbGw9IiMwMEYwRkYiLz4KPC9zdmc+Cg==';

const GoogleIcon = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 33 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="0.5" width="32" height="32" rx="4" fill="#F1F2F9"></rect>
      <path
        d="M26.1001 16.2273C26.1001 15.5182 26.0365 14.8364 25.9183 14.1818H16.5001V18.05H21.8819C21.6501 19.3 20.9456 20.3591 19.8865 21.0682V23.5773H23.1183C25.0092 21.8364 26.1001 19.2727 26.1001 16.2273Z"
        fill="#4285F4"
      ></path>
      <path
        d="M16.5001 26C19.2001 26 21.4637 25.1046 23.1182 23.5773L19.8864 21.0682C18.991 21.6682 17.8455 22.0227 16.5001 22.0227C13.8955 22.0227 11.691 20.2637 10.9046 17.9H7.56372V20.4909C9.20917 23.7591 12.591 26 16.5001 26Z"
        fill="#34A853"
      ></path>
      <path
        d="M10.9047 17.8999C10.7047 17.2999 10.591 16.659 10.591 15.9999C10.591 15.3408 10.7047 14.6999 10.9047 14.0999V11.509H7.56376C6.86376 12.9025 6.49951 14.4405 6.50012 15.9999C6.50012 17.6136 6.88649 19.1408 7.56376 20.4908L10.9047 17.8999Z"
        fill="#FBBC05"
      ></path>
      <path
        d="M16.5001 9.97726C17.9682 9.97726 19.2864 10.4818 20.3228 11.4727L23.191 8.60454C21.4591 6.99091 19.1955 6 16.5001 6C12.591 6 9.20917 8.2409 7.56372 11.5091L10.9046 14.1C11.691 11.7364 13.8955 9.97726 16.5001 9.97726Z"
        fill="#EA4335"
      ></path>
    </svg>
  );
};

const TwitterIcon = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 33 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="0.5" width="32" height="32" rx="4" fill="black"></rect>
      <path
        d="M8.53901 8L14.7164 16.2153L8.5 22.8947H9.89907L15.3415 17.0468L19.7389 22.8947H24.5L17.975 14.2173L23.7612 8H22.3621L17.3499 13.3858L13.3001 8H8.53901ZM10.5964 9.02501H12.7837L22.4422 21.8695H20.255L10.5964 9.02501Z"
        fill="#F7F7F7"
      ></path>
    </svg>
  );
};

const TelegramIcon = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="512" height="512" rx="15%" fill="#37aee2"></rect>
      <path fill="#c8daea" d="M199 404c-11 0-10-4-13-14l-32-105 245-144"></path>
      <path fill="#a9c9dd" d="M199 404c7 0 11-4 16-8l45-43-56-34"></path>
      <path
        fill="#f6fbfe"
        d="M204 319l135 99c14 9 26 4 30-14l55-258c5-22-9-32-24-25L79 245c-21 8-21 21-4 26l83 26 190-121c9-5 17-3 11 4"
      ></path>
    </svg>
  );
};

const isAvatarImageSrc = (icon: string) =>
  typeof icon === 'string' &&
  (icon.startsWith('http://') ||
    icon.startsWith('https://') ||
    icon.startsWith('data:image/') ||
    icon.startsWith('blob:') ||
    icon.startsWith('/'));

const Avatar: FC<AvatarProps> = ({
  size = 24,
  loading,
  icon,
  className,
  meta,
}) => {
  if (loading) {
    return (
      <Skeleton
        style={{
          height: size,
          width: size,
        }}
        className={cn('rounded-full', className)}
      />
    );
  }

  if (icon === 'google_oauth') {
    return <GoogleIcon size={size} className={cn('rounded-full', className)} />;
  }

  if (icon === 'twitter_oauth') {
    return (
      <TwitterIcon size={size} className={cn('rounded-full', className)} />
    );
  }

  if (icon === 'telegram') {
    return (
      <TelegramIcon size={size} className={cn('rounded-full', className)} />
    );
  }

  if (!icon || !isAvatarImageSrc(icon)) {
    return <WalletIcon size={size} className={cn('rounded-full', className)} />;
  }

  const _icon = meta?.id.includes('bitget') ? bitgetWalletIcon : icon;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={_icon}
      height={size}
      width={size}
      alt="avatar"
      className={cn('rounded-full', className)}
    />
  );
};

export default Avatar;
