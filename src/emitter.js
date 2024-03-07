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
 * Constructs a new Event instance with the given name, id, and handler function.
 * 
 * @param {string} name - The name of the event.
 * @param {number} id - The unique ID of the event. 
 * @param {Function} func - The handler function to call when the event is emitted.
 */
function Event(name, id, func) {
  this.name = name;
  this.id = id;
  this.func = func;
}

const MAX_REGISTRATIONS = 50;

/**
 * Emitter class that handles event registration and triggering.
 * 
 * Allows registering events with a name and ID, unregistering events, 
 * and triggering events by name to call all registered handlers.
 * Also supports one-time event handlers that are removed after being triggered once.
 */
function Emitter() {
  const events = [];
  const oneTime = [];

  /**
 * Searches the events array for an event matching the given name and ID.
 * 
 * @param {string} name - The name of the event to find.
 * @param {number} id - The ID of the event to find.
 * 
 * @returns {number} The index of the matching event in the events array, or -1 if not found.
 */
  const getEventIndex = (name, id) => {
    let idx = events.length;
    while (idx) {
      idx -= 1;
      if (events[idx].name === name && events[idx].id === id) {
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
 * @param {number|Function} id - The ID of the event or the handler function if id not provided.
 * @param {Function} [func] - The handler function if provided as 3rd argument.
 */
  this.register = (name, id, func) => {
    if (!name) {
      return;
    }

    let callback = func;
    if (is.func(id)) {
      if (is.string(callback)) {
        const temp = callback;
        callback = id;
        id = temp;
      } else {
        callback = id;
        id = 'all';
      }
    }

    const idx = getEventIndex(name, id);
    const ev = new Event(name, id, callback);
    if (idx === -1) {
      events.push(ev);
    } else {
      events[idx] = ev;
    }
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
    oneTime.push(ev);
  };

  /**
 * Registers multiple event handlers based on keys of an object.
 * 
 * @param {string} id - The event identifier.
 * @param {Object} obj - An object whose keys are event names and values are callbacks.
 */
  this.onMany = (id, obj) => {
    if (!obj) {
      return;
    }

    Object.keys(obj).forEach((key) => {
      this.on(key, id, obj[key]);
    });
  };

  /**
 * Unregisters an event handler based on the name and ID.
 * 
 * Accepts the event name and optional ID. The ID defaults to 'all'.
 * Finds the matching event handler by name and ID and removes it from the events array.
 * If ID is 'all', removes all handlers for that event name.
 * Also removes matching one-time handlers from the oneTime array.
 * 
 * @param {string} name - The name of the event. 
 * @param {string} [id] - The ID of the handler. Defaults to 'all'.
 */
  this.unregister = (name, id) => {
    if (!name) {
      return;
    }

    id = !id ? 'all' : id;
    let idx = 0;

    if (id === 'all') {
      idx = events.length;
      while (idx) {
        idx -= 1;
        if (events[idx].name === name && events[idx].id === 'all') {
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

    idx = getEventIndex(name, id);
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
 * Removes all event handlers with the given ID from the events array.
 * Loops through the events array backwards, splicing out any handlers
 * that match the given ID.
 */
  this.offAll = (id) => {
    let idx = events.length;
    while (idx) {
      idx -= 1;
      if (events[idx].id === id) {
        events.splice(idx, 1);
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

    let idx = oneTime.length;
    while (idx) {
      idx -= 1;
      if (oneTime[idx].name === name) {
        oneTime[idx].func(data, name);
        oneTime.splice(idx, 1);
      }
    }
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
 * Checks if the given event name and ID are registered.
 * 
 * @param {string} name - The event name
 * @param {string} [id='all'] - The event ID. Omit for all events of the given name.
 * @returns {boolean} True if an event with the given name and ID is registered.
 */
  this.isRegistered = (name, id) => {
    id = !id ? 'all' : id;

    let idx = events.length;
    while (idx) {
      idx -= 1;
      if (events[idx].id === id && events[idx].name === name) {
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

export default Emitter;