type Callback = (...args: any) => void;

type WarningHandler = (message: string) => void;
type ErrorHandler = (error: any, name: string) => void;

interface IEmitterConfig {
  readonly maxListeners: number;
  readonly maxOnceListeners: number;
  readonly onWarning: WarningHandler;
  readonly onError: ErrorHandler;
}

interface IEvent {
  name: string;
  namespace: string;
  func: Callback;
  priority: number;
}

declare class Emitter {
  constructor(config?: Partial<IEmitterConfig>);
  readonly config: IEmitterConfig;
  getEvents(name: string): IEvent[];
  register(name: string, func: Callback, priority?: number): void;
  register(name: string, namespace: string, func: Callback, priority?: number): void;
  register(name: string, func: Callback, namespace: string): void;
  on(name: string, func: Callback, priority?: number): void;
  on(name: string, namespace: string, func: Callback, priority?: number): void;
  on(name: string, func: Callback, namespace: string): void;
  subscribe(name: string, func: Callback, priority?: number): void;
  subscribe(name: string, namespace: string, func: Callback, priority?: number): void;
  subscribe(name: string, func: Callback, namespace: string): void;
  once(name: string, func: Callback): void;
  once(name: string, namespace: string, func: Callback): void;
  onMany(namespace: string, obj: { [key: string]: Callback }): void;
  unregister(name: string, namespace?: string): void;
  off(name: string, namespace?: string): void;
  unsubscribe(name: string, namespace?: string): void;
  offAll(namespace: string): void;
  triggerOneTime(name: string, data?: any): void;
  trigger(name: string, data?: any): void;
  emit(name: string, data?: any): void;
  publish(name: string, data?: any): void;
  propagate(data: any, name: string): void;
  isRegistered(name: string, namespace?: string): boolean;
  static HIGH_PRIORITY: number;
  static NORMAL_PRIORITY: number;
  static LOW_PRIORITY: number;
}

export default Emitter;
export { Callback, IEmitterConfig, IEvent, WarningHandler, ErrorHandler };
