export type SocialAvatarPlatform = 'x' | 'discord';

export const getCustomSocialAvatarUrl = (
  platform: SocialAvatarPlatform,
  avatarUrl: string | null,
) => {
  if (!avatarUrl) return null;

  const normalizedUrl = avatarUrl.toLowerCase();
  const isDefaultAvatar =
    platform === 'discord'
      ? normalizedUrl.includes('cdn.discordapp.com/embed/avatars/') ||
        normalizedUrl.includes('media.discordapp.net/embed/avatars/')
      : normalizedUrl.includes('/default_profile_images/') ||
        normalizedUrl.includes('abs.twimg.com/sticky/default_profile');

  return isDefaultAvatar ? null : avatarUrl;
};
