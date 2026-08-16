'use client';

import type { PushArg, ResData, PushData, PushCallback } from './type';

export enum CONNECT_STATUS {
  'disconnected',
  'connecting',
  'connected',
}

export enum EVENT_NAMES {
  CLOSE = 'ws:close',
  RECONNECT = 'ws:reconnect',
  ERROR = 'ws:error',
}

enum ACTION {
  unsub = 0,
  sub = 1,
}

// timeout 1min
const TIMEOUT_INTERVAL = 1 * 60 * 1000;
const PING_INTERVAL = 5000;

const wsInstanceRecords: Record<string, Ws> = {};

export default class Ws extends EventTarget {
  url: string;
  instance: WebSocket | null;

  protected connectStatus: CONNECT_STATUS = CONNECT_STATUS.disconnected;
  protected isReady: boolean = false;
  protected listenerMap: Map<PushArg, Set<PushCallback>> = new Map();
  protected userListenerMap: Map<PushArg, Set<PushCallback>> = new Map();

  private disconnectCount: number = 0;
  private reconnectInterval: number = 0;
  private interval: ReturnType<typeof setTimeout> | null = null;
  private closeEvent: CustomEvent;
  private reconnectEvent: CustomEvent;
  private errorEvent: CustomEvent;
  private activeTime = Date.now();
  private userAddress: string | undefined;

  public channelMap: Map<string, Map<string, PushArg>> = new Map();

  constructor(url: string = '') {
    super();
    this.url = url;
    this.instance = null;
    this.closeEvent = new CustomEvent(EVENT_NAMES.CLOSE, { detail: this });
    this.reconnectEvent = new CustomEvent(EVENT_NAMES.RECONNECT, {
      detail: this,
    });
    this.errorEvent = new CustomEvent(EVENT_NAMES.ERROR, {
      detail: this,
    });

    // one instance
    if (wsInstanceRecords[url]) {
      return wsInstanceRecords[url];
    } else {
      wsInstanceRecords[url] = this;
    }
  }

  protected connect() {
    // no url, ws disconnected
    if (
      !this.url ||
      this.connectStatus !== CONNECT_STATUS.disconnected
    ) {
      return;
    }
    // logger.info('ws is connecting...', this.url);
    this.instance = new WebSocket(this.url);
    this.connectStatus = CONNECT_STATUS.connecting;

    this.instance.addEventListener('open', this.onOpen);
    this.instance.addEventListener('close', this.onClose);
    this.instance.addEventListener('error', this.onError);
    this.instance.addEventListener('message', this.onMessage);

    // handle offline
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
    document.removeEventListener('visibilitychange', this.onVisibilitychange);
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    document.addEventListener('visibilitychange', this.onVisibilitychange);
  }

  private reconnect() {
    // direct connect
    if (this.connectStatus === CONNECT_STATUS.disconnected) {
      this.connect();
      // disconnect
    } else if (this.connectStatus === CONNECT_STATUS.connected) {
      this.instance?.close();
    }
  }

  private initTimer() {
    this.activeTime = Date.now();
    if (this.interval) return;
    // client send ping，timeout, reconnect ws
    this.interval = setInterval(() => {
      const inactiveTime = Date.now() - this.activeTime;
      if (inactiveTime - PING_INTERVAL > TIMEOUT_INTERVAL) {
        this.reconnect();
      } else if (inactiveTime >= PING_INTERVAL) {
        this.instance?.send('ping');
      }
    }, PING_INTERVAL); // less than 30s
  }

  private removeTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private resetTimer() {
    this.reconnectInterval = 0;
    this.initTimer();
  }

  private onOpen = () => {
    this.connectStatus = CONNECT_STATUS.connected;
    // logger.info('ws is connected', this.url);
    this.initTimer();
    this.handleOpen();
    if (this.disconnectCount > 0) {
      this.dispatchEvent(this.reconnectEvent);
    }
  };

  protected handleOpen() {
    this.isReady = true;
    this.sendCachedSubscribe();
  }

  protected sendCachedSubscribe() {
    const needSendArgs = [...this.listenerMap.keys()];
    if (needSendArgs.length) {
      const msg = JSON.stringify({
        action: ACTION.sub,
        streams: needSendArgs,
      });
      this.instance?.send(msg);
    }

    const needSendUserArgs = [...this.userListenerMap.keys()];
    if (needSendUserArgs.length && this.userAddress) {
      const msg = JSON.stringify({
        action: ACTION.sub,
        streams: needSendUserArgs,
        user_addr: this.userAddress,
      });
      this.instance?.send(msg);
    }
  }

  private onClose = (event: CloseEvent) => {
    this.connectStatus = CONNECT_STATUS.disconnected;
    this.disconnectCount++;
    this.isReady = false;
    this.removeTimer();
    this.handleClose(event.code, event.reason);
  };

  protected handleClose(code: number, reason: string) {
    void code;
    void reason;
    // logger.info(this.url, '=====ws close====');
    // logger.info(`code: ${code}; reason: ${reason}`);
    this.dispatchEvent(this.closeEvent);
    // reconnect
    setTimeout(() => {
      // every 1s, max 10s
      this.reconnectInterval =
        this.reconnectInterval >= 10000 ? 10000 : this.reconnectInterval + 1000;
      this.reconnect();
    }, this.reconnectInterval);
  }

  private onError = (event: Event) => {
    void event;
    // logger.error(err);
    this.dispatchEvent(this.errorEvent);
  };

  private onMessage = (event: MessageEvent) => {
    this.resetTimer();
    const str = event.data.toString();
    // receive pong
    if (str === 'pong') {
      return;
    }
    // response ping
    if (str === 'ping') {
      this.instance?.send('pong');
      return;
    }
    const res = JSON.parse(str);
    this.handleMessage(res);
  };

  // ppage visiblitity
  private onVisibilitychange = () => {
    if (document.visibilityState === 'visible') {
      this.reconnectInterval = 0;
      // timeout reconnect ws
      if (Date.now() - this.activeTime > TIMEOUT_INTERVAL) {
        this.reconnect();
      }
    }
  };

  private onOnline = () => {
    // reconnect
    this.connect();
  };

  private onOffline = () => {
    // handle offline
    this.instance?.close();
  };

  protected handleMessage(res: ResData) {
    this.handleSubscribeMsg(res as unknown as PushData);
  }

  protected handleSubscribeMsg(res: PushData) {
    const { stream } = res;
    if (!Object.prototype.hasOwnProperty.call(res, 'data')) return;
    if (this.listenerMap.get(stream)) {
      this.listenerMap.get(stream)?.forEach((callback) => {
        callback(res);
      });
    } else if (this.userListenerMap.get(stream)) {
      this.userListenerMap.get(stream)?.forEach((callback) => {
        callback(res);
      });
    }
  }

  subscribe(params: [PushArg, PushCallback][]) {
    if (!this.instance) {
      this.connect();
    }
    const needSendArgs: PushArg[] = [];
    params.forEach(([arg, callback]) => {
      const cbSet = this.listenerMap.get(arg);
      if (!cbSet) {
        this.listenerMap.set(arg, new Set([callback]));
        needSendArgs.push(arg);
      } else {
        cbSet.add(callback);
      }
    });
    if (this.isReady && needSendArgs.length) {
      this.instance?.send(
        JSON.stringify({
          action: ACTION.sub,
          streams: needSendArgs,
        }),
      );
    }
  }

  unsubscribe(params: [PushArg, PushCallback][]) {
    const needSendArgs: PushArg[] = [];
    params.forEach(([arg, callback]) => {
      const cbSet = this.listenerMap.get(arg);
      if (cbSet) {
        cbSet.delete(callback);
        if (cbSet.size === 0) {
          this.listenerMap.delete(arg);
          needSendArgs.push(arg);
        }
      }
    });
    if (this.isReady && needSendArgs.length) {
      this.instance?.send(
        JSON.stringify({
          action: ACTION.unsub,
          streams: needSendArgs,
        }),
      );
    }
  }

  // login
  login(userAddress?: string) {
    const prevUserAddress = this.userAddress;
    this.userAddress = userAddress;

    const needSendArgs = [...this.userListenerMap.keys()];
    if (this.isReady && needSendArgs.length) {
      if (prevUserAddress) {
        // unsub
        const msg = JSON.stringify({
          action: ACTION.unsub,
          streams: needSendArgs,
          user_addr: prevUserAddress,
        });
        this.instance?.send(msg);
      }

      if (userAddress) {
        // resub
        const msg = JSON.stringify({
          action: ACTION.sub,
          streams: needSendArgs,
          user_addr: userAddress,
        });
        this.instance?.send(msg);
      }
    }
  }

  userSubscribe(params: [PushArg, PushCallback][]) {
    if (!this.instance) {
      this.connect();
    }
    const needSendArgs: PushArg[] = [];
    params.forEach(([arg, callback]) => {
      const cbSet = this.userListenerMap.get(arg);
      if (!cbSet) {
        this.userListenerMap.set(arg, new Set([callback]));
        needSendArgs.push(arg);
      } else {
        cbSet.add(callback);
      }
    });
    if (this.isReady && needSendArgs.length && this.userAddress) {
      this.instance?.send(
        JSON.stringify({
          action: ACTION.sub,
          streams: needSendArgs,
          user_addr: this.userAddress,
        }),
      );
    }
  }

  userUnsubscribe(params: [PushArg, PushCallback][]) {
    const needSendArgs: PushArg[] = [];
    params.forEach(([arg, callback]) => {
      const cbSet = this.userListenerMap.get(arg);
      if (cbSet) {
        cbSet.delete(callback);
        if (cbSet.size === 0) {
          this.userListenerMap.delete(arg);
          needSendArgs.push(arg);
        }
      }
    });
    if (this.isReady && needSendArgs.length && this.userAddress) {
      this.instance?.send(
        JSON.stringify({
          action: ACTION.unsub,
          streams: needSendArgs,
          user_addr: this.userAddress,
        }),
      );
    }
  }
}
