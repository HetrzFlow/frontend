import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSocialOAuthReturnPath,
  parseSocialOAuthCallback,
  toSocialOAuthProvider,
} from './socialOAuth.ts';

test('parses a successful backend OAuth landing result', () => {
  assert.deepEqual(
    parseSocialOAuthCallback(
      new URLSearchParams('bind=success&platform=twitter'),
    ),
    {
      type: 'oauth_callback',
      bind: 'success',
      platform: 'twitter',
      reason: undefined,
    },
  );
});

test('parses a failed backend OAuth landing result', () => {
  assert.deepEqual(
    parseSocialOAuthCallback(
      new URLSearchParams('bind=error&platform=discord&reason=access_denied'),
    ),
    {
      type: 'oauth_callback',
      bind: 'error',
      platform: 'discord',
      reason: 'access_denied',
    },
  );
});

test('rejects callback query strings without a documented outcome', () => {
  assert.equal(
    parseSocialOAuthCallback(new URLSearchParams('code=legacy-code')),
    null,
  );
});

test('maps backend Twitter naming to the frontend X provider', () => {
  assert.equal(toSocialOAuthProvider('twitter'), 'x');
  assert.equal(toSocialOAuthProvider('discord'), 'discord');
});

test('builds a safe return path with the binding result', () => {
  assert.equal(
    buildSocialOAuthReturnPath('/en/genesis?code=ABC123#social', {
      type: 'oauth_callback',
      bind: 'success',
      platform: 'discord',
    }),
    '/en/genesis?code=ABC123&social_bind=success&social_platform=discord#social',
  );
});

test('does not allow an external or recursive callback return path', () => {
  const message = {
    type: 'oauth_callback',
    bind: 'error',
    reason: 'invalid_state',
  };

  assert.equal(
    buildSocialOAuthReturnPath('//evil.example', message),
    '/?social_bind=error&social_reason=invalid_state',
  );
  assert.equal(
    buildSocialOAuthReturnPath('/auth/callback', message),
    '/?social_bind=error&social_reason=invalid_state',
  );
});
