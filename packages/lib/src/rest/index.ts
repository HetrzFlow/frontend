import { NET_ERR_CODE } from './enum';

// AbortSignal.any and timeout
AbortSignal.any =
  AbortSignal.any ??
  function (signals) {
    const controller = new AbortController();

    function onAbort() {
      controller.abort();
      signals.forEach((s) => s.removeEventListener('abort', onAbort));
    }

    signals.forEach((s) => {
      if (s.aborted) {
        controller.abort();
      } else {
        s.addEventListener('abort', onAbort);
      }
    });

    return controller.signal;
  };

AbortSignal.timeout =
  AbortSignal.timeout ??
  function (ms) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };

async function request({
  url,
  fetchOption: { method, headers = {}, body, signal },
  config: { timeout = 5000 } = {},
}: {
  url: string;
  fetchOption: {
    method: 'GET' | 'POST' | 'DELETE';
    headers?: Record<string, string | number>;
    body?: string;
    signal?: AbortSignal;
  };
  config?: {
    timeout?: number;
  };
}) {
  const timeoutSignal = AbortSignal.timeout(timeout);
  const signals = signal ? [signal, timeoutSignal] : [timeoutSignal];

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body,
      signal: AbortSignal.any(signals),
    });
    if (!response.ok) {
      let errMsg = `HTTP ${response.status}`;
      try {
        const text = await response.text();
        if (text) errMsg = text;
      } catch {
        // ignore body parse errors
      }
      throw {
        code: NET_ERR_CODE.HttpError,
        status: response.status,
        errMsg,
      };
    }
    return response.json();
  } catch (error) {
    if ((error as Error).name === 'TimeoutError') {
      throw {
        code: NET_ERR_CODE.Timeout,
        errMsg: `Fetch aborted with timeout: ${timeout}`,
      };
    } else if ((error as Error).name === 'AbortError') {
      throw {
        code: NET_ERR_CODE.Abort,
        errMsg: 'Fetch aborted by user',
      };
    }
    throw error;
  }
}

async function get<T>(
  endpoint: string,
  params?: Record<string, unknown> | string[][],
  config?: {
    timeout?: number;
    signal?: AbortSignal;
  },
): Promise<T> {
  const paramsArr = (
    params instanceof Array ? params : Object.entries(params || {})
  ).filter(([, v]) => v !== undefined);

  const paramsString = paramsArr.length
    ? new URLSearchParams(paramsArr as string[][]).toString()
    : '';
  return request({
    url: `${endpoint}${paramsString ? `?${paramsString}` : ''}`,
    fetchOption: {
      method: 'GET',
      signal: config?.signal,
    },
    config,
  });
}

async function post(
  endpoint: string,
  data: Record<string, unknown>,
  config?: {
    timeout?: number;
    signal?: AbortSignal;
  },
) {
  return request({
    url: `${endpoint}`,
    fetchOption: {
      method: 'POST',
      body: JSON.stringify(data),
      signal: config?.signal,
    },
    config,
  });
}

async function del(endpoint: string) {
  return request({
    url: `${endpoint}`,
    fetchOption: {
      method: 'DELETE',
    },
  });
}

export { get, post, del };
export { NET_ERR_CODE } from './enum';

// online listener
export const addOnlineListener = (fn: () => void) => {
  window.addEventListener('online', fn);

  return () => {
    window.removeEventListener('online', fn);
  };
};

// offline listener
export const addOfflineListener = (fn: () => void) => {
  window.addEventListener('offline', fn);

  return () => {
    window.removeEventListener('offline', fn);
  };
};
