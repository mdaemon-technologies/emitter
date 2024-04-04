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

/**
 * Constructs a new Event instance with the given name, namespace, and handler function.
 * 
 * @param {string} name - The name of the event.
 * @param {number} namespace - The unique namespace of the event. 
 * @param {Function} func - The handler function to call when the event is emitted.
 */
function Event(name, namespace, func, priority) {
  this.name = name;
  this.namespace = namespace;
  this.func = func;
  this.priority = is.number(priority) ? priority : 1;
}

const MAX_LISTENERS = 50;

/**
 * Emitter class that handles event registration and triggering.
 * 
 * Allows registering events with a name and namespace, unregistering events, 
 * and triggering events by name to call all registered handlers.
 * Also supports one-time event handlers that are removed after being triggered once.
 */
function Emitter(config) {
  const self = this;
  this.config = {};
  
  Object.defineProperty(self.config, "maxListeners", {
    value: config && typeof config.maxListeners === "number" ? config.maxListeners : MAX_LISTENERS,
    writable: false,
    enumerable: true
  });

  Object.defineProperty(self.config, "maxOnceListeners", {
    value: config && typeof config.maxOnceListeners === "number" ? config.maxOnceListeners : MAX_LISTENERS,
    writable: false,
    enumerable: true
  });

  const events = [];
  const oneTime = [];

  const reachedMaxListeners = (name) => {
    return events.filter((ev) => ev.name === name).length >= this.config.maxListeners;
  };

  const reachedMaxOnceListeners = (name) => {
    return oneTime.filter((ev) => ev.name === name).length >= this.config.maxListeners;
  };

  /**
 * Searches the events array for an event matching the given name and namespace.
 * 
 * @param {string} name - The name of the event to find.
 * @param {number} namespace - The namespace of the event to find.
 * 
 * @returns {number} The index of the matching event in the events array, or -1 if not found.
 */
  const getEventIndex = (name, namespace) => {
    let idx = events.length;
    while (idx) {
      idx -= 1;
      if (events[idx].name === name && events[idx].namespace === namespace) {
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
  const getEvents = (name) => {
    const evs = [];
    
    for (let idx = 0, iMax = events.length; idx < iMax; idx += 1) {
      if (events[idx].name.indexOf("*") > -1 || events[idx].name.indexOf("?") > -1) {
        let regexSearch = new RegExp(events[idx].name.replace(/\*/g, ".*"));
        if (regexSearch.test(name)) {
          evs.push(events[idx]);
          continue;
        }
      }

      if (events[idx].name === name) {
        evs.push(events[idx]);
      }
    }
    return evs;
  };


  /**
 * Registers an event handler.
 * 
 * @param {string} name - The name of the event.
 * @param {number|Function} namespace - The namespace of the event or the handler function if namespace not provided. 
 * @param {Function} [callback] - The handler function if provided as 3rd argument.
 * @param {number} [priority] - The priority of the handler used for sorting.
 */
  this.register = (name, namespace, callback, priority) => {
    if (!name) {
      return;
    }

    if (typeof priority !== "undefined" && !is.number(priority)) {
      throw new Error("priority must be a number");
    }

    if (is.func(namespace)) {
      if (is.string(callback)) {
        const temp = callback;
        callback = namespace;
        namespace = temp;
      } else {
        if (is.number(callback)) {
          priority = callback;
        }
        callback = namespace;
        namespace = 'all';
      }
    }

    const idx = getEventIndex(name, namespace);
    const ev = new Event(name, namespace, callback, priority);
    if (idx === -1) {
      if (reachedMaxListeners(name)) {
        console.warn(`Max listeners reached for event ${name}`);
      } else {
        events.push(ev);
      }
    } else {
      events[idx] = ev;
    }

    events.sort((a, b) => a.priority === b.priority ? 0 : (a.priority < b.priority ? 1 : -1));
  };

  /**
 * Registers an event handler using this.register.
 * Provides an alias for register().
 */
  this.on = this.register;
  /**
 * Provides an alias for register().
 */
  this.subscribe = this.register;

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
  this.once = (name, func) => {
    if (!name) {
      return;
    }

    const ev = new Event(name, '', func);
    if (reachedMaxOnceListeners(name)) {
      console.warn(`Max once listeners reached for event ${name}`);
    } else {
      oneTime.push(ev);
    }
  };

  /**
 * Registers multiple event handlers based on keys of an object.
 * 
 * @param {string} namespace - The event identifier.
 * @param {Object} obj - An object whose keys are event names and values are callbacks.
 */
  this.onMany = ( namespace, obj) => {
    if (!obj) {
      return;
    }

    Object.keys(obj).forEach((key) => {
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
 * @param {string} [namespace] - The namespace of the handler. Defaults to 'all'.
 */
  this.unregister = (name, namespace) => {
    if (!name) {
      return;
    }

   namespace = !namespace ? 'all' : namespace;
    let idx = 0;

    if (namespace === 'all') {
      idx = events.length;
      while (idx) {
        idx -= 1;
        if (events[idx].name === name && events[idx].namespace === 'all') {
          events.splice(idx, 1);
        }
      }

      idx = oneTime.length;
      while (idx) {
        idx -= 1;
        if (oneTime[idx].name === name) {
          oneTime.splice(idx, 1);
        }
      }

      return;
    }

    idx = getEventIndex(name, namespace);
    if (idx !== -1) {
      events.splice(idx, 1);
    }
  };

  /**
 * Alias for unregister method
 */
  this.off = this.unregister;
  /**
 * Alias for unregister method
 */
  this.unsubscribe = this.unregister;

  /**
 * Removes all event handlers with the given namespace from the events array.
 * Loops through the events array backwards, splicing out any handlers
 * that match the given namespace.
 */
  this.offAll = (namespace) => {
    let idx = events.length;
    while (idx) {
      idx -= 1;
      if (events[idx].namespace === namespace) {
        events.splice(idx, 1);
      }
    }
  };

  const triggerOneTime = (name, data) => {
    let idx = oneTime.length;
    while (idx) {
      idx -= 1;
      if (oneTime[idx].name.indexOf("*") > -1 || oneTime[idx].name.indexOf("?") > -1) {
        let regexSearch = new RegExp(oneTime[idx].name.replace(/\*/g, ".*").replace(/\?/g, "."));
        if (regexSearch.test(name)) {
          oneTime[idx].func(data, name);
          oneTime.splice(idx, 1);
          continue;
        }
      }

      if (oneTime[idx].name === name) {
        oneTime[idx].func(data, name);
        oneTime.splice(idx, 1);
      }
    }
  };

  /**
 * Triggers all registered event handlers for the given event name. 
 * Loops through all handlers registered for the event and calls them with the provided data.
 * Also loops through and calls any one-time handlers registered for the event before removing them.
*/
  this.trigger = (name, data) => {
    const evs = getEvents(name);
    for (let idx = 0, iMax = evs.length; idx < iMax; idx += 1) {
      evs[idx].func(data, name);
    }

    triggerOneTime(name, data);
  };

  /**
 * Alias for trigger method
 */
  this.emit = this.trigger;
  /**
 * Alias for trigger method
 */
  this.publish = this.trigger;

  /**
 * Triggers all registered event handlers for the given event name by calling this.trigger.
 * @param {*} data The data to pass to the event handlers
 * @param {string} name The name of the event 
 */
  this.propagate = (data, name) => {
    this.trigger(name, data);
  };

  /**
 * Checks if the given event name and namespace are registered.
 * 
 * @param {string} name - The event name
 * @param {string} [ namespace='all'] - The event namespace. Omit for all events of the given name.
 * @returns {boolean} True if an event with the given name and namespace is registered.
 */
  this.isRegistered = (name, namespace) => {
    namespace = !namespace ? 'all' : namespace;

    let idx = events.length;
    while (idx) {
      idx -= 1;
      if (events[idx].namespace === namespace && events[idx].name === name) {
        return true;
      }
    }

    idx = oneTime.length;
    while (idx) {
      idx -= 1;
      if (oneTime[idx].name === name) {
        return true;
      }
    }

    return false;
  };
}

Emitter.HIGH_PRIORITY = 2;
Emitter.NORMAL_PRIORITY = 1;
Emitter.LOW_PRIORITY = 0;

export default Emitter;