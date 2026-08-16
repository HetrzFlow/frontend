import assert from 'node:assert/strict';
import test from 'node:test';

import { getCustomSocialAvatarUrl } from './socialAvatar.ts';

test('uses the app fallback for missing and Discord default avatars', () => {
  assert.equal(getCustomSocialAvatarUrl('discord', null), null);
  assert.equal(getCustomSocialAvatarUrl('discord', ''), null);
  assert.equal(
    getCustomSocialAvatarUrl(
      'discord',
      'https://cdn.discordapp.com/embed/avatars/3.png',
    ),
    null,
  );
  assert.equal(
    getCustomSocialAvatarUrl(
      'discord',
      'https://media.discordapp.net/embed/avatars/4.png?size=64',
    ),
    null,
  );
});

test('keeps a custom Discord avatar URL', () => {
  const url = 'https://cdn.discordapp.com/avatars/123/avatar-hash.png';
  assert.equal(getCustomSocialAvatarUrl('discord', url), url);
});

test('uses the app fallback for X default profile images', () => {
  assert.equal(
    getCustomSocialAvatarUrl(
      'x',
      'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
    ),
    null,
  );
  assert.equal(
    getCustomSocialAvatarUrl(
      'x',
      'https://example.com/default_profile_images/default_profile.png',
    ),
    null,
  );
});

test('keeps a custom X profile image URL', () => {
  const url =
    'https://pbs.twimg.com/profile_images/1267175364003901441/avatar_normal.jpg';
  assert.equal(getCustomSocialAvatarUrl('x', url), url);
});
