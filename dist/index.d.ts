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