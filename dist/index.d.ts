declare interface isTypes {
  string(str: any): boolean;
  object(str: any): boolean;
  array(str: any): boolean;
  number(str: any): boolean;
  bool(str: any): boolean;
  func(str: any): boolean;
  nul(str: any): boolean;
  undef(str: any): boolean;
}

declare namespace is {
  type ProtoType = isTypes;
}

export = Emitter;

declare class Emitter {
  register(name: string, namespace: string, func: ((data: any) => any)): void;
  on(name: string, namespace: string, func: ((data: any) => any)): void;
  subscribe(name: string, namespace: string, func: ((data: any) => any)): void;
  once(name: string, func: ((data: any) => any)): void;
  onMany(namespace: string, obj: any): void;
  unregister(name: string, namespace: string): void;
  off(name: string, namespace: string): void;
  unsubscribe(name: string, namespace: string): void;
  offAll(namespace: string): void;
  trigger(name: string, data?: any): void;
  emit(name: string, data?: any): void;
  publish(name: string, data?: any): void;
  propagate(data: any, name: string): void;
  isRegistered(name: string, namespace: string): boolean;
}
