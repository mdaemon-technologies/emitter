/*
*    Copyright (C) 1998-2022  MDaemon Technologies, Ltd.
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

const is = require("./is");

function Event(name, id, func) {
  this.name = name;
  this.id = id;
  this.func = func;
}

function Emitter() {
  const events = [];
  const oneTime = [];

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

  const getEvents = (name) => {
    const evs = [];
    for (let idx = 0, iMax = events.length; idx < iMax; idx += 1) {
      if (events[idx].name === name) {
        evs.push(events[idx]);
      }
    }

    return evs;
  };

  this.register = (name, id, func) => {
    const eventName = name;
    let callback = func;
    let eventId = id;
    if (is.func(eventId)) {
      if (is.string(callback)) {
        const temp = callback;
        callback = eventId;
        eventId = temp;
      } else {
        callback = id;
        eventId = 'all';
      }
    }

    if (!eventName) {
      return;
    }

    const idx = getEventIndex(eventName, eventId);
    const ev = new Event(eventName, eventId, callback);
    if (idx === -1) {
      events.push(ev);
    } else {
      events[idx] = ev;
    }
  };

  this.on = this.register;
  this.subscribe = this.register;

  this.once = (name, func) => {
    if (!name) {
      return;
    }

    const ev = new Event(name, '', func);
    oneTime.push(ev);
  };

  this.onMany = (id, obj) => {
    if (!obj) {
      return;
    }

    Object.keys(obj).forEach((key) => {
      this.on(key, id, obj[key]);
    });
  };

  this.unregister = (name, id) => {
    const eventId = !id ? 'all' : id;

    if (!name) {
      return;
    }

    let idx = 0;

    if (eventId === 'all') {
      idx = events.length;
      while (idx) {
        idx -= 1;
        if (events[idx].id === 'all') {
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

  this.off = this.unregister;
  this.unsubscribe = this.unregister;

  this.offAll = (id) => {
    let idx = events.length;
    while (idx) {
      idx -= 1;
      if (events[idx].id === id) {
        events.splice(idx, 1);
      }
    }
  };

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

  this.emit = this.trigger;
  this.publish = this.trigger;

  this.propagate = (data, name) => {
    this.trigger(name, data);
  };

  this.isRegistered = (name, id) => {
    const eventId = !id ? 'all' : id;

    let idx = events.length;
    while (idx) {
      idx -= 1;
      if (events[idx].id === eventId && events[idx].name === name) {
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

module.exports = Emitter;