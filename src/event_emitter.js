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

import is from "is";

function Event(name, id, func) {
  this.name = name;
  this.id = id;
  this.func = func;
}

function Emitter() {
  var events = [];

  var oneTime = [];

  var getEventIndex = function (name, id) {
    var i = events.length;
    while (i--) {
      if (events[i].name === name && events[i].id === id) {
        return i;
      }
    }

    return -1;
  };

  var getEvents = function (name) {
    var evs = [];
    for (var i = 0, iMax = events.length; i < iMax; i++) {
      if (events[i].name === name) {
        evs.push(events[i]);
      }
    }

    return evs;
  };

  this.register = function (name, id, func) {
    if (is.func(id)) {
      if (is.string(func)) {
        var temp = func;
        func = id;
        id = temp;
      }
      else {
        func = id;
        id = "all";
      }
    }

    if (!name) {
      return;
    }

    var idx = getEventIndex(name, id);
    var ev = new Event(name, id, func);
    if (idx === -1) {
      events.push(ev);
    } else {
      events[idx] = ev;
    }
  };

  this.on = this.register;

  this.once = function (name, func) {
    if (!name) {
      return;
    }

    var ev = new Event(name, "", func);
    oneTime.push(ev);
  };

  this.onMany = function (id, obj) {

    if (!obj) {
      return;
    }

    for (var ev in obj) {
      this.on(ev, id, obj[ev]);
    }
  };

  this.unregister = function (name, id) {
    if (!id) {
      id = "all";
    }

    if (!name) {
      return;
    }

    var idx = 0;

    if (id === "all") {
      idx = events.length;
      while (idx--) {
        if (events[idx].id === "all") {
          events.splice(idx, 1);
        }
      }
      return;
    }

    idx = getEventIndex(name, id);
    if (idx !== -1) {
      events.splice(idx, 1);
    }

    idx = oneTime.length;
    while (idx--) {
      if (oneTime[idx].name === name) {
        oneTime.splice(idx, 1);
      }
    }
  };

  this.off = this.unregister;

  this.offAll = function (id) {
    var i = events.length;
    while (i--) {
      if (events[i].id === id) {
        events.splice(i, 1);
      }
    }
  };

  this.trigger = function (name, data) {

    var evs = getEvents(name);
    for (var i = 0, iMax = evs.length; i < iMax; i++) {
      evs[i].func(data, name);
    }


    var idx = oneTime.length;
    while (idx--) {
      if (oneTime[idx].name === name) {
        oneTime[idx].func(data, name);
        oneTime.splice(idx, 1);
      }
    }
  };

  this.emit = this.trigger;

  this.propagate = function (data, name) {
    this.trigger(name, data);
  };

  this.isRegistered = function (name, id) {
    var i = events.length;
    while (i--) {
      if (events[i].id === id && events[i].name === name) {
        return true;
      }
    }

    return false;
  };
}

export default Emitter;