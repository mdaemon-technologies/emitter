/*
*    Copyright (C) 1998-2023  MDaemon Technologies, Ltd.
*
*    This library is free software; you can redistribute it and/or
*    modify it under the terms of the GNU Lesser General Public
*    License as published by the Free Software Foundation; either
*    version 2.1 of the License, or (at your option) any later version.
*
*    This library is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
*    Lesser General Public License for more details.
*
*    You should have received a copy of the GNU Lesser General Public
*    License along with this library; if not, write to the Free Software
*    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
*    USA
*/

import is from "./is";

type Callback = (...args: any) => void;

type WarningHandler = (message: string) => void;
type ErrorHandler = (error: any, name: string) => void;

interface IEvent {
  name: string;
  namespace: string;
  func: Callback;
  priority: number;
}

interface IEmitterConfig {
  readonly maxListeners: number;
  readonly maxOnceListeners: number;
  readonly onWarning: WarningHandler;
  readonly onError: ErrorHandler;
}

interface IMany {
  [key: string]: Callback;
}

type RegisterFn = (name: string, arg1: Callback | string, arg2?: Callback | string | number, arg3?: number) => void;
type UnregisterFn = (name: string, namespace?: string) => void;
type TriggerFn = (name: string, data?: any) => void;

const MAX_LISTENERS = 50;
const DEFAULT_NAMESPACE = "all";

const HIGH_PRIORITY = 2;
const NORMAL_PRIORITY = 1;
const LOW_PRIORITY = 0;

/* Characters that carry meaning inside a regular expression and therefore have
 * to be escaped when an event name is compiled into a matcher. "*" and "?" are
 * deliberately absent: those are the wildcards this library supports. */
const REGEX_SPECIAL_CHARS = ".+^${}()|[]\\/";

/**
 * The default warning sink, used when no onWarning handler is configured.
 *
 * @param {string} message - The warning to report.
 */
function defaultWarningHandler(message: string): void {
  console.warn(message);
}

/**
 * The default error sink, used when no onError handler is configured.
 *
 * @param {*} error - The value thrown by an event handler.
 * @param {string} name - The name of the event being emitted.
 */
function defaultErrorHandler(error: any, name: string): void {
  console.error(`Error thrown by a handler for event ${name}`, error);
}

/**
 * Compiles an event name into an anchored matcher, but only when the name
 * actually contains a wildcard.
 *
 * "*" matches any run of characters and "?" matches exactly one. Every other
 * character is escaped, so a name such as "price(usd)*" can never produce an
 * invalid regular expression. The result is anchored, so "user.*" matches
 * "user.created" but not "superuser.created".
 *
 * @param {string} name - The event name to compile.
 * @returns {RegExp|null} The matcher, or null when the name has no wildcards.
 */
function compileMatcher(name: string): RegExp | null {
  if (name.indexOf("*") === -1 && name.indexOf("?") === -1) {
    return null;
  }

  let pattern = "";
  for (let idx = 0, iMax = name.length; idx < iMax; idx += 1) {
    const char = name.charAt(idx);
    if (char === "*") {
      pattern += ".*";
    }
    else if (char === "?") {
      pattern += ".";
    }
    else {
      pattern += REGEX_SPECIAL_CHARS.indexOf(char) > -1 ? "\\" + char : char;
    }
  }

  return new RegExp("^" + pattern + "$");
}

/**
 * Returns a configured listener limit, falling back to the default when the
 * supplied value is missing or not a usable number.
 *
 * @param {*} value - The configured value, which may be undefined.
 * @param {number} fallback - The default limit.
 * @returns {number} The limit to enforce.
 */
function toLimit(value: any, fallback: number): number {
  return is.number(value) && value >= 0 ? value : fallback;
}

/**
 * Returns a configured handler, falling back to the default when the supplied
 * value is missing or not a function.
 *
 * @param {*} value - The configured handler, which may be undefined.
 * @param {Function} fallback - The default handler.
 * @returns {Function} The handler to use.
 */
function toHandler(value: any, fallback: any): any {
  return is.func(value) ? value : fallback;
}

/**
 * A registered event handler, along with the matcher compiled from its name.
 *
 * The matcher is built once at registration rather than on every emit.
 */
class EmitterEvent implements IEvent {
  name: string;
  namespace: string;
  func: Callback;
  priority: number;
  matcher: RegExp | null;

  constructor(name: string, namespace: string, func: Callback, priority?: number) {
    this.name = name;
    this.namespace = namespace;
    this.func = func;
    this.priority = is.number(priority) ? (priority as number) : NORMAL_PRIORITY;
    this.matcher = compileMatcher(name);
  }

  /**
   * Tests whether this registration should fire for the emitted event name.
   *
   * @param {string} name - The name being emitted.
   * @returns {boolean} True when this handler matches.
   */
  matches(name: string): boolean {
    return this.matcher ? this.matcher.test(name) : this.name === name;
  }
}

/**
 * Emitter class that handles event registration and triggering.
 *
 * Allows registering _emitter_events with a name and namespace, unregistering
 * _emitter_events, and triggering _emitter_events by name to call all
 * registered handlers. Also supports one-time event handlers that are removed
 * after being triggered once.
 *
 * Methods are declared on the prototype so that subclasses can override them,
 * and are bound to the instance in the constructor so that detached references
 * (for example passing emitter.propagate as a handler to another emitter, or
 * Object.assign(this, new Emitter())) continue to work. Binding reads through
 * the prototype chain, so a subclass override is picked up rather than shadowed.
 */
class Emitter {
  static HIGH_PRIORITY = HIGH_PRIORITY;
  static NORMAL_PRIORITY = NORMAL_PRIORITY;
  static LOW_PRIORITY = LOW_PRIORITY;

  private _emitter_config: IEmitterConfig;
  private _emitter_events: EmitterEvent[] = [];
  private _emitter_oneTime: EmitterEvent[] = [];

  /**
   * Provides an alias for register().
   */
  on: RegisterFn;
  /**
   * Provides an alias for register().
   */
  subscribe: RegisterFn;
  /**
   * Provides an alias for unregister().
   */
  off: UnregisterFn;
  /**
   * Provides an alias for unregister().
   */
  unsubscribe: UnregisterFn;
  /**
   * Provides an alias for trigger().
   */
  emit: TriggerFn;
  /**
   * Provides an alias for trigger().
   */
  publish: TriggerFn;

  constructor(config?: Partial<IEmitterConfig>) {
    /* Frozen so that the documented immutability of the config is real. Each
     * field falls back independently, so a partial config is safe. */
    this._emitter_config = Object.freeze({
      maxListeners: toLimit(config && config.maxListeners, MAX_LISTENERS),
      maxOnceListeners: toLimit(config && config.maxOnceListeners, MAX_LISTENERS),
      onWarning: toHandler(config && config.onWarning, defaultWarningHandler) as WarningHandler,
      onError: toHandler(config && config.onError, defaultErrorHandler) as ErrorHandler
    });

    this.getEvents = this.getEvents.bind(this);
    this.register = this.register.bind(this);
    this.once = this.once.bind(this);
    this.onMany = this.onMany.bind(this);
    this.unregister = this.unregister.bind(this);
    this.offAll = this.offAll.bind(this);
    this.triggerOneTime = this.triggerOneTime.bind(this);
    this.trigger = this.trigger.bind(this);
    this.propagate = this.propagate.bind(this);
    this.isRegistered = this.isRegistered.bind(this);

    /* The aliases are the same function object as the method they alias, which
     * is a documented part of the API (emitter.register === emitter.on). */
    this.on = this.register;
    this.subscribe = this.register;
    this.off = this.unregister;
    this.unsubscribe = this.unregister;
    this.emit = this.trigger;
    this.publish = this.trigger;
  }

  get config(): IEmitterConfig {
    return this._emitter_config;
  }

  /**
   * Counts the handlers already registered under an exact event name and
   * reports whether the supplied limit has been reached.
   *
   * @param {EmitterEvent[]} events - The list to count within.
   * @param {string} name - The exact event name.
   * @param {number} limit - The configured maximum.
   * @returns {boolean} True when no further handler should be added.
   */
  private reachedMax(events: EmitterEvent[], name: string, limit: number): boolean {
    let count = 0;
    for (let idx = 0, iMax = events.length; idx < iMax; idx += 1) {
      if (events[idx].name === name) {
        count += 1;
      }
    }

    return count >= limit;
  }

  /**
   * Calls each handler in turn, reporting anything they throw to the
   * configured onError handler.
   *
   * Handlers are isolated from one another: one that throws cannot stop the
   * rest of the list from being called, and cannot surface at the emit site.
   *
   * @param {IEvent[]} events - The handlers to call.
   * @param {string} name - The name of the event being emitted.
   * @param {*} data - The data to pass to the handlers.
   */
  private invokeAll(events: IEvent[], name: string, data: any): void {
    for (let idx = 0, iMax = events.length; idx < iMax; idx += 1) {
      try {
        events[idx].func(data, name);
      }
      catch (error) {
        this._emitter_config.onError(error, name);
      }
    }
  }

  /**
   * Resolves the handler and namespace from the overloaded argument forms
   * accepted by register() and once().
   *
   * @param {string} name - The event name, used only for the error message.
   * @param {string|Function} arg1 - The namespace, or the handler.
   * @param {Function} [arg2] - The handler, when a namespace was given.
   * @returns {Object} The resolved namespace and handler.
   */
  private resolveHandler(name: string, arg1: Callback | string, arg2?: Callback): { namespace: string, callback: Callback } {
    const namespace = is.func(arg1) ? DEFAULT_NAMESPACE : arg1 as string;
    const callback = is.func(arg1) ? arg1 as Callback : arg2 as Callback;

    if (!is.func(callback)) {
      throw new TypeError(`The handler registered for event ${name} must be a function`);
    }

    return { namespace: namespace, callback: callback };
  }

  /**
   * Gets all _emitter_events that match the given name, in priority order.
   *
   * Returns a new array, so handlers are free to register or unregister while
   * the emit that produced it is still in progress.
   *
   * @param {string} name - The name of the _emitter_events to get.
   * @returns {IEvent[]} The array of matching _emitter_events.
   */
  getEvents(name: string): IEvent[] {
    const evs: IEvent[] = [];

    for (let idx = 0, iMax = this._emitter_events.length; idx < iMax; idx += 1) {
      if (this._emitter_events[idx].matches(name)) {
        evs.push(this._emitter_events[idx]);
      }
    }

    return evs;
  }

  /**
   * Registers an event handler.
   *
   * Every call adds a handler; registering twice under the same name and
   * namespace leaves both handlers in place.
   *
   * @param {string} name - The name of the event.
   * @param {string|Function} arg1 - The namespace of the event, or the handler function if no namespace is provided.
   * @param {Function|string|number} [arg2] - The handler function, the namespace, or the priority.
   * @param {number} [arg3] - The priority of the handler used for sorting.
   * @throws {TypeError} When no function is supplied as the handler.
   */
  register(name: string, arg1: Callback | string, arg2?: Callback | string | number, arg3?: number): void {
    if (!name) {
      return;
    }

    let priority = NORMAL_PRIORITY;
    if (is.number(arg3)) {
      priority = arg3 as number;
    }

    /* on(name, func, namespace) and on(name, func, priority) both put the
     * handler first, so the trailing argument decides what it means. */
    let namespace: string;
    let callback: Callback;
    if (is.func(arg1)) {
      const resolved = this.resolveHandler(name, arg1);
      callback = resolved.callback;
      namespace = is.string(arg2) ? arg2 as string : DEFAULT_NAMESPACE;
      if (is.number(arg2)) {
        priority = arg2 as number;
      }
    }
    else {
      const resolved = this.resolveHandler(name, arg1, arg2 as Callback);
      callback = resolved.callback;
      namespace = resolved.namespace;
    }

    if (this.reachedMax(this._emitter_events, name, this._emitter_config.maxListeners)) {
      this._emitter_config.onWarning(`Max listeners reached for event ${name}`);
      return;
    }

    this._emitter_events.push(new EmitterEvent(name, namespace, callback, priority));
    this._emitter_events.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Registers a one-time event handler.
   *
   * The namespace defaults to 'all', matching register(), so a one-time
   * handler can be removed by unregister() or offAll() like any other.
   * The handler is removed before it is called, so it can never fire twice.
   *
   * @param {string} name - The name of the event.
   * @param {string|Function} arg1 - The namespace, or the handler function if no namespace is provided.
   * @param {Function} [arg2] - The handler function, when a namespace was provided.
   * @throws {TypeError} When no function is supplied as the handler.
   */
  once(name: string, arg1: Callback | string, arg2?: Callback): void {
    if (!name) {
      return;
    }

    const resolved = this.resolveHandler(name, arg1, arg2);

    if (this.reachedMax(this._emitter_oneTime, name, this._emitter_config.maxOnceListeners)) {
      this._emitter_config.onWarning(`Max once listeners reached for event ${name}`);
      return;
    }

    this._emitter_oneTime.push(new EmitterEvent(name, resolved.namespace, resolved.callback, NORMAL_PRIORITY));
  }

  /**
   * Registers multiple event handlers based on keys of an object.
   *
   * @param {string} namespace - The event identifier.
   * @param {Object} obj - An object whose keys are event names and values are callbacks.
   * @throws {TypeError} When any value in the object is not a function.
   */
  onMany(namespace: string, obj: IMany): void {
    if (!obj) {
      return;
    }

    const keys = Object.keys(obj);

    /* The whole object is checked up front so that a bad entry cannot leave a
     * partial set of registrations behind. */
    for (let idx = 0, iMax = keys.length; idx < iMax; idx += 1) {
      if (!is.func(obj[keys[idx]])) {
        throw new TypeError(`The handler registered for event ${keys[idx]} must be a function`);
      }
    }

    keys.forEach((key: string) => {
      this.on(key, namespace, obj[key]);
    });
  }

  /**
   * Unregisters event handlers based on the name and namespace.
   *
   * The namespace defaults to 'all'. Every handler registered under the given
   * name and namespace is removed, one-time handlers included. Note that 'all'
   * is the default namespace, not a wildcard: handlers registered under an
   * explicit namespace are only removed by passing that namespace, or by
   * offAll().
   *
   * @param {string} name - The name of the event.
   * @param {string} [namespace='all'] - The namespace of the handler.
   */
  unregister(name: string, namespace: string = DEFAULT_NAMESPACE): void {
    if (!name) {
      return;
    }

    const ns = !namespace ? DEFAULT_NAMESPACE : namespace;

    this._emitter_events = this._emitter_events.filter((ev) => ev.name !== name || ev.namespace !== ns);
    this._emitter_oneTime = this._emitter_oneTime.filter((ev) => ev.name !== name || ev.namespace !== ns);
  }

  /**
   * Removes all event handlers with the given namespace, one-time handlers
   * included.
   *
   * @param {string} namespace - The namespace to clear.
   */
  offAll(namespace: string): void {
    this._emitter_events = this._emitter_events.filter((ev) => ev.namespace !== namespace);
    this._emitter_oneTime = this._emitter_oneTime.filter((ev) => ev.namespace !== namespace);
  }

  /**
   * Triggers and removes the one-time handlers matching the given name.
   *
   * Matching handlers are detached from the queue before any of them is
   * called, so a handler is free to register or unregister one-time handlers
   * without disturbing the emit in progress.
   *
   * @param {string} name - The name of the event.
   * @param {*} [data] - The data to pass to the handlers.
   */
  triggerOneTime(name: string, data?: any): void {
    const matched: EmitterEvent[] = [];
    const remaining: EmitterEvent[] = [];

    for (let idx = 0, iMax = this._emitter_oneTime.length; idx < iMax; idx += 1) {
      const ev = this._emitter_oneTime[idx];
      if (ev.matches(name)) {
        matched.push(ev);
      }
      else {
        remaining.push(ev);
      }
    }

    if (!matched.length) {
      return;
    }

    this._emitter_oneTime = remaining;

    this.invokeAll(matched, name, data);
  }

  /**
   * Triggers all registered event handlers for the given event name.
   * Loops through all handlers registered for the event and calls them with the provided data.
   * Also calls any one-time handlers registered for the event before removing them.
   *
   * A handler that throws is reported to the configured onError handler and
   * does not prevent the remaining handlers from being called.
   *
   * @param {string} name - The name of the event.
   * @param {*} [data] - The data to pass to the handlers.
   */
  trigger(name: string, data?: any): void {
    this.invokeAll(this.getEvents(name), name, data);

    this.triggerOneTime(name, data);
  }

  /**
   * Triggers all registered event handlers for the given event name by calling this.trigger.
   *
   * @param {*} data The data to pass to the event handlers
   * @param {string} name The name of the event
   */
  propagate(data: any, name: string): void {
    this.trigger(name, data);
  }

  /**
   * Checks if the given event name and namespace are registered, one-time
   * handlers included.
   *
   * @param {string} name - The event name
   * @param {string} [namespace='all'] - The event namespace.
   * @returns {boolean} True if an event with the given name and namespace is registered.
   */
  isRegistered(name: string, namespace?: string): boolean {
    const ns = !namespace ? DEFAULT_NAMESPACE : namespace;

    for (let idx = 0, iMax = this._emitter_events.length; idx < iMax; idx += 1) {
      if (this._emitter_events[idx].namespace === ns && this._emitter_events[idx].name === name) {
        return true;
      }
    }

    for (let idx = 0, iMax = this._emitter_oneTime.length; idx < iMax; idx += 1) {
      if (this._emitter_oneTime[idx].namespace === ns && this._emitter_oneTime[idx].name === name) {
        return true;
      }
    }

    return false;
  }
}

export default Emitter;
