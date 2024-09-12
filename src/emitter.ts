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

interface IEvent {
  name: string;
  namespace: string;
  func: Callback;
  priority: number;
}

const MAX_LISTENERS = 50;

/**
 * Constructs a new Event instance with the given name, namespace, and handler function.
 * 
 * @param {string} name - The name of the event.
 * @param {number} namespace - The unique namespace of the event. 
 * @param {Function} func - The handler function to call when the event is emitted.
 */
function Event(name: string, namespace: string, func: Callback, priority: number) {
  this.name = name;
  this.namespace = namespace;
  this.func = func;
  this.priority = is.number(priority) ? priority : 1;
}

interface IEmitterConfig {
  maxListeners: number;
  maxOnceListeners: number;
}

interface IMany {
  [key: string]: Callback;
}

/**
 * Emitter class that handles event registration and triggering.
 * 
 * Allows registering events with a name and namespace, unregistering events, 
 * and triggering events by name to call all registered handlers.
 * Also supports one-time event handlers that are removed after being triggered once.
 */
class Emitter {
  static HIGH_PRIORITY = 2;
  static NORMAL_PRIORITY = 1;
  static LOW_PRIORITY = 0;
  
  private config: IEmitterConfig;
  private events: IEvent[] = [];
  private oneTime: IEvent[] = [];
  
  constructor(config?: IEmitterConfig) {
    const self = this;
    if (!config) {
      this.config = {
        maxListeners: MAX_LISTENERS,
        maxOnceListeners: MAX_LISTENERS
      };
    }
    else {
      this.config = config;
    }
  }

  private reachedMaxListeners = (name: string) => {
    return this.events.filter((ev) => ev.name === name).length >= this.config.maxListeners;
  };

  private reachedMaxOnceListeners = (name: string) => {
    return this.oneTime.filter((ev) => ev.name === name).length >= this.config.maxListeners;
  };

  /**
 * Searches the events array for an event matching the given name and namespace.
 * 
 * @param {string} name - The name of the event to find.
 * @param {number} namespace - The namespace of the event to find.
 * 
 * @returns {number} The index of the matching event in the events array, or -1 if not found.
 */
  private getEventIndex = (name: string, namespace: string) => {
    let idx = this.events.length;
    while (idx) {
      idx -= 1;
      if (this.events[idx].name === name && this.events[idx].namespace === namespace) {
        return idx;
      }
    }

    return -1;
  };

  /**
 * Gets all events with the given name.
 * 
 * Loops through the events array and collects any 
 * events that match the provided name.
 * 
 * @param {string} name - The name of the events to get.
 * @returns {Event[]} The array of matching events.
 */
  getEvents = (name: string) => {
    const evs: IEvent[] = [];
    
    for (let idx = 0, iMax = this.events.length; idx < iMax; idx += 1) {
      if (this.events[idx].name.indexOf("*") > -1 || this.events[idx].name.indexOf("?") > -1) {
        let regexSearch = new RegExp(this.events[idx].name.replace(/\*/g, ".*"));
        if (regexSearch.test(name)) {
          evs.push(this.events[idx]);
          continue;
        }
      }

      if (this.events[idx].name === name) {
        evs.push(this.events[idx]);
      }
    }
    return evs;
  };


  /**
 * Registers an event handler.
 * 
 * @param {string} name - The name of the event.
 * @param {string|Function} namespace - The namespace of the event or the handler function if namespace not provided. 
 * @param {Function} [callback] - The handler function if provided as 3rd argument.
 * @param {number} [priority] - The priority of the handler used for sorting.
 */
  register = (name: string, arg1: Callback | string, arg2?: Callback | string | number, arg3?: number) => {
    if (!name) {
      return;
    }

    let namespace = 'all';
    let callback: Callback;
    let priority = 1;

    if (typeof arg3 !== "undefined" && is.number(arg3)) {
      priority = arg3;
    }

    if (is.func(arg1)) {
      if (is.string(arg2)) {
        callback = arg1 as Callback
        namespace = arg2 as string;
      } 
      else {
        if (is.number(arg2)) {
          priority = arg2 as number;
        }
        callback = arg1 as Callback;
        namespace = 'all';
      }
    }
    else {
      namespace = arg1 as string;
      callback = arg2 as Callback;
    }

    const idx = this.getEventIndex(name, namespace);
    const ev = new Event(name, namespace, callback, priority);
    if (idx === -1) {
      if (this.reachedMaxListeners(name)) {
        console.warn(`Max listeners reached for event ${name}`);
      } else {
        this.events.push(ev);
      }
    } else {
      this.events[idx] = ev;
    }

    this.events.sort((a, b) => a.priority === b.priority ? 0 : (a.priority < b.priority ? 1 : -1));
  };

  /**
 * Registers an event handler using this.register.
 * Provides an alias for register().
 */
  on = this.register;
  /**
 * Provides an alias for register().
 */
  subscribe = this.register;

  /**
 * Registers a one-time event handler.
 * 
 * Accepts the event name and callback function. 
 * Creates a new Event instance and adds it to the oneTime array.
 * The event will be removed after it is emitted once.
 * 
 * @param {string} name - The name of the event.
 * @param {Function} func - The callback function.
 */
  once = (name: string, func: Callback) => {
    if (!name) {
      return;
    }

    const ev = new Event(name, '', func, 1);
    if (this.reachedMaxOnceListeners(name)) {
      console.warn(`Max once listeners reached for event ${name}`);
    } else {
      this.oneTime.push(ev);
    }
  };

  /**
 * Registers multiple event handlers based on keys of an object.
 * 
 * @param {string} namespace - The event identifier.
 * @param {Object} obj - An object whose keys are event names and values are callbacks.
 */
  onMany = (namespace: string, obj: IMany) => {
    if (!obj) {
      return;
    }

    Object.keys(obj).forEach((key: string) => {
      this.on(key, namespace, obj[key]);
    });
  };

  /**
 * Unregisters an event handler based on the name and namespace.
 * 
 * Accepts the event name and optional namespace. The namespace defaults to 'all'.
 * Finds the matching event handler by name and namespace and removes it from the events array.
 * If namespace is 'all', removes all handlers for that event name.
 * Also removes matching one-time handlers from the oneTime array.
 * 
 * @param {string} name - The name of the event. 
 * @param {string} namespace - The namespace of the handler. Defaults to 'all'.
 */
  unregister = (name: string, namespace?: string) => {
    if (!name) {
      return;
    }

   namespace = !namespace ? 'all' : namespace;
    let idx = 0;

    if (namespace === 'all') {
      idx = this.events.length;
      while (idx) {
        idx -= 1;
        if (this.events[idx].name === name && this.events[idx].namespace === 'all') {
          this.events.splice(idx, 1);
        }
      }

      idx = this.oneTime.length;
      while (idx) {
        idx -= 1;
        if (this.oneTime[idx].name === name) {
          this.oneTime.splice(idx, 1);
        }
      }

      return;
    }

    idx = this.getEventIndex(name, namespace);
    if (idx !== -1) {
      this.events.splice(idx, 1);
    }
  };

  /**
 * Alias for unregister method
 */
  off = this.unregister;
  /**
 * Alias for unregister method
 */
  unsubscribe = this.unregister;

  /**
 * Removes all event handlers with the given namespace from the events array.
 * Loops through the events array backwards, splicing out any handlers
 * that match the given namespace.
 */
  offAll = (namespace: string) => {
    let idx = this.events.length;
    while (idx) {
      idx -= 1;
      if (this.events[idx].namespace === namespace) {
        this.events.splice(idx, 1);
      }
    }
  };

  triggerOneTime = (name: string, data: any) => {
    let idx = this.oneTime.length;
    while (idx) {
      idx -= 1;
      if (this.oneTime[idx].name.indexOf("*") > -1 || this.oneTime[idx].name.indexOf("?") > -1) {
        let regexSearch = new RegExp(this.oneTime[idx].name.replace(/\*/g, ".*").replace(/\?/g, "."));
        if (regexSearch.test(name)) {
          this.oneTime[idx].func(data, name);
          this.oneTime.splice(idx, 1);
          continue;
        }
      }

      if (this.oneTime[idx].name === name) {
        this.oneTime[idx].func(data, name);
        this.oneTime.splice(idx, 1);
      }
    }
  };

  /**
 * Triggers all registered event handlers for the given event name. 
 * Loops through all handlers registered for the event and calls them with the provided data.
 * Also loops through and calls any one-time handlers registered for the event before removing them.
*/
  trigger = (name: string, data: any) => {
    const evs = this.getEvents(name);
    for (let idx = 0, iMax = evs.length; idx < iMax; idx += 1) {
      evs[idx].func(data, name);
    }

    this.triggerOneTime(name, data);
  };

  /**
 * Alias for trigger method
 */
  emit = this.trigger;
  /**
 * Alias for trigger method
 */
  publish = this.trigger;

  /**
 * Triggers all registered event handlers for the given event name by calling this.trigger.
 * @param {*} data The data to pass to the event handlers
 * @param {string} name The name of the event 
 */
  propagate = (data: any, name: string) => {
    this.trigger(name, data);
  };

  /**
 * Checks if the given event name and namespace are registered.
 * 
 * @param {string} name - The event name
 * @param {string} [ namespace='all'] - The event namespace. Omit for all events of the given name.
 * @returns {boolean} True if an event with the given name and namespace is registered.
 */
  isRegistered = (name: string, namespace?: string) => {
    namespace = !namespace ? 'all' : namespace;

    let idx = this.events.length;
    while (idx) {
      idx -= 1;
      if (this.events[idx].namespace === namespace && this.events[idx].name === name) {
        return true;
      }
    }

    idx = this.oneTime.length;
    while (idx) {
      idx -= 1;
      if (this.oneTime[idx].name === name) {
        return true;
      }
    }

    return false;
  };
}

export default Emitter;