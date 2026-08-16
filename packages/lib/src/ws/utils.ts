import Ws from './Ws';

import type { Arg, PushArg, PushCallback, PushParams } from './type';

export type ChannelMap = Map<string, Map<string, PushArg>>;

function getArg(
  channelMap: ChannelMap,
  channel: string,
  param: string,
  arg: PushArg,
): PushArg {
  const argMap = channelMap.get(channel);
  if (!argMap) {
    channelMap.set(channel, new Map([[param, arg]]));
    return arg;
  } else {
    const _arg = argMap.get(param);
    if (_arg) {
      return _arg;
    } else {
      argMap.set(param, arg);
      return arg;
    }
  }
}

// transform params to meet ws.subscribe params
function transformParams<R>(
  channelMap: ChannelMap,
  channel: string,
  params:
    | ({ callback: PushCallback<R> } & PushParams)[]
    | ({ callback: PushCallback<R> } & PushParams),
  fields: (keyof PushParams)[],
): [PushArg, PushCallback<R>][] {
  const allParams = params instanceof Array ? params : [params];
  return allParams.map((_param) => {
    const { callback } = _param;
    let param = '';
    let arg: PushArg = '';
    fields.forEach((field) => {
      param += `${_param[field]}`;
      arg = arg ? `${_param[field]},${arg}` : `${_param[field]}`;
    });
    return [
      getArg(channelMap, channel, param, arg ? `${arg}@${channel}` : channel),
      callback,
    ] as [PushArg, PushCallback<R>];
  });
}

// generate subscribe and unsubscribe function
export function generateSub<T extends PushParams, R>(
  ws: Ws,
  channel: string,
  fields: (keyof Omit<Arg, 'channel'>)[],
  needLogin?: boolean,
): [
  (
    params:
      | ({ callback: PushCallback<R> } & T)[]
      | ({ callback: PushCallback<R> } & T),
  ) => () => void,
  (
    params:
      | ({ callback: PushCallback<R> } & T)[]
      | ({ callback: PushCallback<R> } & T),
  ) => void,
] {
  return [
    (params) => {
      const _params = transformParams<R>(
        ws.channelMap,
        channel,
        params,
        fields,
      );
      if (needLogin) {
        ws.userSubscribe(_params);

        return () => {
          ws.userUnsubscribe(_params);
        };
      } else {
        ws.subscribe(_params);

        return () => {
          ws.unsubscribe(_params);
        };
      }
    },
    (params) => {
      (needLogin ? ws.userUnsubscribe : ws.unsubscribe)(
        transformParams<R>(ws.channelMap, channel, params, fields),
      );
    },
  ];
}
