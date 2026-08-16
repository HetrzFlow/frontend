'use client';

import { useEffect, useState } from 'react';

import {
  buildSocialOAuthReturnPath,
  consumeSocialOAuthReturnPath,
  getSocialOAuthFlowMode,
  parseSocialOAuthCallback,
  publishSocialOAuthCallback,
  toSocialOAuthProvider,
} from '@/common/oauth/socialOAuth';

const OAuthCallbackPage = () => {
  const [status, setStatus] = useState('Connecting your social account…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = parseSocialOAuthCallback(params);

    if (!message) {
      setStatus('The authorization result is invalid.');
      return;
    }

    const returnToApp = () => {
      const provider = toSocialOAuthProvider(message.platform);
      const returnPath = consumeSocialOAuthReturnPath(provider);
      window.location.replace(buildSocialOAuthReturnPath(returnPath, message));
    };

    const provider = toSocialOAuthProvider(message.platform);
    const isPopupFlow = getSocialOAuthFlowMode(provider) === 'popup';

    if (isPopupFlow && provider) {
      publishSocialOAuthCallback(provider, message);
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(message, window.location.origin);
      }
      setStatus(
        message.bind === 'success'
          ? 'Connected. Returning to HertzFlow…'
          : 'Authorization was not completed.',
      );
      const closeTimer = window.setTimeout(() => window.close(), 100);
      return () => window.clearTimeout(closeTimer);
    }

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, window.location.origin);
      setStatus(
        message.bind === 'success'
          ? 'Connected. Returning to HertzFlow…'
          : 'Authorization was not completed.',
      );
      const closeTimer = window.setTimeout(() => window.close(), 100);
      return () => window.clearTimeout(closeTimer);
    }

    returnToApp();
  }, []);

  return (
    <main className="bg-bg-1 text-t-1100 flex min-h-dvh items-center justify-center px-6 text-center">
      <div>
        <p className="text-base font-medium">{status}</p>
        <p className="text-t-430 mt-2 text-xs">
          You can return to HertzFlow if this page does not close automatically.
        </p>
      </div>
    </main>
  );
};

export default OAuthCallbackPage;
