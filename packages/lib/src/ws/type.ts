// sub params
export type Arg = {
  channel: string;
  [x: string]: string | boolean | undefined;
};

export type PushParams = Omit<Arg, 'channel'>;

export type ResData<T = never> = {
  id?: string;
  event?: string;
  op?: string;
  arg: Arg;
  code: string;
  msg: string;
  data?: T;
};

// ws push arg type
export type PushArg = string;

// ws push data type
export type PushData<T = never> = {
  stream: PushArg;
  data: T;
};
export type Callback<T = never> = (res: ResData<T>) => void;
export type PushCallback<T = never> = (res: PushData<T>) => void;
