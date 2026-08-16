const POPUP_TIMEOUT_MS = 10 * 60 * 1000;
const POPUP_CLOSED_POLL_MS = 500;
const RETURN_STORAGE_KEY = 'hertzflow:social-oauth:v2:return';
const CALLBACK_CHANNEL_PREFIX = 'hertzflow:social-oauth:v2:callback';
const RETURN_STORAGE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_RETURN_PATH = '/';

export type SocialOAuthProvider = 'x' | 'discord';
export type SocialOAuthApiPlatform = 'twitter' | 'discord';
export type SocialOAuthOutcome = 'success' | 'error';

export type SocialOAuthErrorCode =
  | 'callback_error'
  | 'invalid_callback'
  | 'popup_closed'
  | 'timeout';

export class SocialOAuthError extends Error {
  readonly code: SocialOAuthErrorCode;

  constructor(code: SocialOAuthErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'SocialOAuthError';
  }
}

export interface SocialOAuthCallbackMessage {
  type: 'oauth_callback';
  bind: SocialOAuthOutcome;
  platform?: SocialOAuthApiPlatform;
  reason?: string;
}

interface StoredOAuthReturn {
  version: 2;
  provider: SocialOAuthProvider;
  mode: 'popup' | 'redirect';
  returnPath: string;
  expiresAt: number;
}

export interface PreparedSocialOAuth {
  mode: 'popup' | 'redirect';
  navigate: (authorizeUrl: string) => Promise<SocialOAuthCallbackMessage>;
  cancel: () => void;
}

const isSocialOAuthCallback = (
  value: unknown,
): value is SocialOAuthCallbackMessage => {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<SocialOAuthCallbackMessage>;
  return (
    message.type === 'oauth_callback' &&
    (message.bind === 'success' || message.bind === 'error')
  );
};

export const toSocialOAuthProvider = (
  platform?: SocialOAuthApiPlatform | null,
): SocialOAuthProvider | undefined => {
  if (platform === 'twitter') return 'x';
  if (platform === 'discord') return 'discord';
  return undefined;
};

export const parseSocialOAuthCallback = (
  searchParams: URLSearchParams,
): SocialOAuthCallbackMessage | null => {
  const bind = searchParams.get('bind');
  if (bind !== 'success' && bind !== 'error') return null;

  const platform = searchParams.get('platform');
  return {
    type: 'oauth_callback',
    bind,
    platform:
      platform === 'twitter' || platform === 'discord' ? platform : undefined,
    reason: searchParams.get('reason') ?? undefined,
  };
};

const sanitizeReturnPath = (returnPath: string | null | undefined) => {
  if (
    !returnPath ||
    !returnPath.startsWith('/') ||
    returnPath.startsWith('//') ||
    returnPath.startsWith('/auth/callback')
  ) {
    return DEFAULT_RETURN_PATH;
  }
  return returnPath;
};

export const buildSocialOAuthReturnPath = (
  returnPath: string,
  message: SocialOAuthCallbackMessage,
) => {
  const url = new URL(sanitizeReturnPath(returnPath), 'https://local.invalid');
  url.searchParams.set('social_bind', message.bind);
  if (message.platform) {
    url.searchParams.set('social_platform', message.platform);
  }
  if (message.reason) {
    url.searchParams.set('social_reason', message.reason);
  }
  return `${url.pathname}${url.search}${url.hash}`;
};

const getPopupFeatures = () => {
  const width = 560;
  const height = 720;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

  return [
    'popup=yes',
    `width=${width}`,
    `height=${height}`,
    `left=${Math.round(left)}`,
    `top=${Math.round(top)}`,
  ].join(',');
};

const shouldUseFullPageOAuth = () =>
  window.matchMedia('(max-width: 767px), (hover: none), (pointer: coarse)')
    .matches;

const getCurrentReturnPath = () =>
  sanitizeReturnPath(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );

const storeOAuthReturn = (
  provider: SocialOAuthProvider,
  returnPath: string,
  mode: StoredOAuthReturn['mode'],
) => {
  const value: StoredOAuthReturn = {
    version: 2,
    provider,
    mode,
    returnPath: sanitizeReturnPath(returnPath),
    expiresAt: Date.now() + RETURN_STORAGE_TTL_MS,
  };
  try {
    localStorage.setItem(RETURN_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Some embedded browsers disable storage. The callback falls back to `/`.
  }
};

const readStoredOAuthReturn = (): StoredOAuthReturn | null => {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(RETURN_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as Partial<StoredOAuthReturn>;
    if (
      stored.version !== 2 ||
      (stored.mode !== 'popup' && stored.mode !== 'redirect') ||
      (stored.provider !== 'x' && stored.provider !== 'discord') ||
      typeof stored.returnPath !== 'string' ||
      typeof stored.expiresAt !== 'number' ||
      stored.expiresAt < Date.now()
    ) {
      return null;
    }
    return stored as StoredOAuthReturn;
  } catch {
    return null;
  }
};

export const getSocialOAuthFlowMode = (
  provider?: SocialOAuthProvider,
): StoredOAuthReturn['mode'] | undefined => {
  const stored = readStoredOAuthReturn();
  if (!stored || (provider && stored.provider !== provider)) return undefined;
  return stored.mode;
};

const getCallbackChannelName = (provider: SocialOAuthProvider) =>
  `${CALLBACK_CHANNEL_PREFIX}:${provider}`;

export const publishSocialOAuthCallback = (
  provider: SocialOAuthProvider,
  message: SocialOAuthCallbackMessage,
) => {
  if (typeof BroadcastChannel === 'undefined') return false;
  const channel = new BroadcastChannel(getCallbackChannelName(provider));
  channel.postMessage(message);
  channel.close();
  return true;
};

const clearOAuthReturn = () => {
  try {
    localStorage.removeItem(RETURN_STORAGE_KEY);
  } catch {
    // Ignore unavailable storage; there is no sensitive value to retain.
  }
};

export const consumeSocialOAuthReturnPath = (
  provider?: SocialOAuthProvider,
) => {
  const stored = readStoredOAuthReturn();
  clearOAuthReturn();
  if (!stored || (provider && stored.provider !== provider)) {
    return DEFAULT_RETURN_PATH;
  }
  return sanitizeReturnPath(stored.returnPath);
};

export const prepareSocialOAuth = (
  provider: SocialOAuthProvider,
): PreparedSocialOAuth => {
  const returnPath = getCurrentReturnPath();

  const popup = shouldUseFullPageOAuth()
    ? null
    : window.open(
        'about:blank',
        `hertzflow-${provider}-oauth`,
        getPopupFeatures(),
      );

  if (!popup) {
    storeOAuthReturn(provider, returnPath, 'redirect');
    return {
      mode: 'redirect',
      navigate: async (authorizeUrl) => {
        window.location.assign(authorizeUrl);
        return new Promise<SocialOAuthCallbackMessage>(() => undefined);
      },
      cancel: clearOAuthReturn,
    };
  }

  storeOAuthReturn(provider, returnPath, 'popup');

  let cleanup = () => undefined;
  let settled = false;
  const callback = new Promise<SocialOAuthCallbackMessage>(
    (resolve, reject) => {
      const settle = (action: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        clearOAuthReturn();
        if (!popup.closed) popup.close();
        action();
      };

      const handleMessage = (event: MessageEvent<unknown>) => {
        if (
          event.origin !== window.location.origin ||
          event.source !== popup ||
          !isSocialOAuthCallback(event.data)
        ) {
          return;
        }

        handleCallback(event.data);
      };

      const handleCallback = (message: SocialOAuthCallbackMessage) => {
        const callbackProvider = toSocialOAuthProvider(message.platform);
        if (callbackProvider && callbackProvider !== provider) {
          settle(() =>
            reject(
              new SocialOAuthError(
                'invalid_callback',
                'The authorization provider does not match the request.',
              ),
            ),
          );
          return;
        }

        if (message.bind === 'error') {
          settle(() =>
            reject(
              new SocialOAuthError(
                'callback_error',
                message.reason || 'Social authorization failed.',
              ),
            ),
          );
          return;
        }

        settle(() => resolve(message));
      };

      window.addEventListener('message', handleMessage);
      const callbackChannel =
        typeof BroadcastChannel === 'undefined'
          ? null
          : new BroadcastChannel(getCallbackChannelName(provider));
      const handleChannelMessage = (event: MessageEvent<unknown>) => {
        if (isSocialOAuthCallback(event.data)) {
          handleCallback(event.data);
        }
      };
      callbackChannel?.addEventListener('message', handleChannelMessage);
      const closePoll = window.setInterval(() => {
        if (popup.closed) {
          settle(() =>
            reject(
              new SocialOAuthError(
                'popup_closed',
                'The authorization window was closed.',
              ),
            ),
          );
        }
      }, POPUP_CLOSED_POLL_MS);
      const timeout = window.setTimeout(() => {
        settle(() =>
          reject(
            new SocialOAuthError(
              'timeout',
              'The authorization request timed out.',
            ),
          ),
        );
      }, POPUP_TIMEOUT_MS);

      cleanup = () => {
        window.removeEventListener('message', handleMessage);
        callbackChannel?.removeEventListener('message', handleChannelMessage);
        callbackChannel?.close();
        window.clearInterval(closePoll);
        window.clearTimeout(timeout);
      };
    },
  );

  return {
    mode: 'popup',
    navigate: async (authorizeUrl) => {
      popup.location.replace(authorizeUrl);
      popup.focus();
      return callback;
    },
    cancel: () => {
      if (settled) return;
      settled = true;
      cleanup();
      clearOAuthReturn();
      if (!popup.closed) popup.close();
    },
  };
};
