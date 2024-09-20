export = Emitter;

declare class Emitter {
  register(name: string, namespace: ((data: any) => any) | string, arg2?: ((data: any) => any), arg3?: number): void;
  on(name: string, namespace: string | ((data: any) => any), arg2?: ((data: any) => any), arg3?: number): void;
  subscribe(name: string, namespace: string | ((data: any) => any), arg2?: ((data: any) => any), arg3?: number): void;
  once(name: string, func: ((data: any) => any)): void;
  onMany(namespace: string, obj: any): void;
  unregister(name: string, namespace?: string): void;
  off(name: string, namespace?: string): void;
  unsubscribe(name: string, namespace?: string): void;
  offAll(namespace: string): void;
  trigger(name: string, data?: any): void;
  emit(name: string, data?: any): void;
  publish(name: string, data?: any): void;
  propagate(data: any, name: string): void;
  isRegistered(name: string, namespace: string): boolean;
}