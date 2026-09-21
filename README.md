# @mdaemon/emitter

[![npm](https://img.shields.io/npm/v/@mdaemon/emitter?color=blue)](https://www.npmjs.com/package/@mdaemon/emitter)
[![license](https://img.shields.io/npm/l/@mdaemon/emitter?color=green)](LICENSE)
[![node](https://img.shields.io/node/v/@mdaemon/emitter)](https://nodejs.org)
[![install size](https://packagephobia.com/badge?p=@mdaemon/emitter)](https://packagephobia.com/result?p=@mdaemon/emitter)
[![CI](https://github.com/mdaemon-technologies/emitter/actions/workflows/node.js.yml/badge.svg)](https://github.com/mdaemon-technologies/emitter/actions/workflows/node.js.yml)

A basic event emitter / publish subscribe library used by MDaemon Webmail

A dependency free event emitter library. The "emitter" provides pub/sub options

## Install

```bash
npm install @mdaemon/emitter
```

## Usage

### ES modules
```js
import Emitter from "@mdaemon/emitter";
```

### CommonJS
```js
const Emitter = require("@mdaemon/emitter");
```

### Browser (UMD)
```html
<script type="text/javascript" src="/path_to_modules/dist/emitter.umd.js">
```

## Emitter

```js
/* this is more typically used as a prototype for a class or object
 * class Messages extends Emitter {}
 *
 * or
 * 
 * function Messages() { 
 *   Object.assign(this, new Emitter());
 * }
 */

// every option may be omitted, and the config is frozen once set
const emitter = new Emitter({
    maxListeners: 20,     // defaults to 50
    maxOnceListeners: 40, // defaults to 50

    // called when a limit is reached and a handler is turned away.
    // defaults to console.warn
    onWarning: (message) => { console.warn(message); },

    // called when a handler throws. defaults to console.error
    onError: (error, name) => { console.error(name, error); }
});

emitter.on("test", "namespace", (input) => {
    console.log(input); 
});

emitter.emit("test", "this is a test");
// this is a test

emitter.off("test", "namespace");

emitter.emit("test", "this will go nowhere");

// if you pass a function as the second parameter, the function will be registered as part of an "all" namespace
emitter.on("test", (input) => {
    console.log(input, "this gets called"); 
});

emitter.emit("test", "calling all");
// calling all this gets called

// registering more than once against the same name and namespace keeps every
// handler, and they are called in priority order
emitter.on("queued", "namespace", () => { console.log("first"); });
emitter.on("queued", "namespace", () => { console.log("second"); });

emitter.emit("queued");
// first
// second

// off removes every handler for that name and namespace
emitter.off("queued", "namespace");

// event names may contain wildcards: "*" matches any run of characters and
// "?" matches exactly one. The whole name has to match, so "user.*" matches
// "user.created" but not "superuser.created"
emitter.on("user.*", (input, name) => {
    console.log(name, input);
});

emitter.emit("user.created", "a new user");
// user.created a new user

// your flavor of pub/sub may vary
// emitter.register === emitter.on === emitter.subscribe 
// emitter.unregister === emitter.off === emitter.unsubscribe
// emitter.trigger === emitter.emit === emitter.publish

emitter.once("only-receive-this-once", (input) => {
    console.log(input); 
});

emitter.trigger("only-receive-this-once", "this was received once, and then removed from memory");
// this was received once, and then removed from memory

// once also accepts a namespace, so a one-time handler can be cleaned up
// before it ever fires
emitter.once("may-never-happen", "namespace", (input) => {
    console.log(input);
});

emitter.offAll("namespace");

// a handler that throws is reported to onError and does not stop the
// handlers that come after it, or surface at the emit call
emitter.on("risky", () => { throw new Error("this is contained"); });
emitter.on("risky", () => { console.log("this still runs"); });

emitter.emit("risky");
// risky Error: this is contained    <- from onError
// this still runs

// registering without a function throws, rather than failing later on emit
try {
    emitter.on("oops", "namespace");
} catch (e) {
    console.log(e.message);
    // The handler registered for event oops must be a function
}

// onMany allows you to register/subscribe multiple items at once
emitter.onMany("namespace", {
    "test": (input) => { console.log("test", input); },
    "test2": (input) => { console.log("test2", input); }
});

emitter.emit("test", "my test");
// test my test

emitter.emit("test2", "another test");
// test2 another test

// isRegistered checks if an event+namespace combination is registered
emitter.isRegistered("test2", "namespace");
// true

// propagate is a reverse parameter of trigger/emit/publish
emitter.propagate("another test", "test2");
// test2 another test

// offAll will remove all subscriptions for a given namespace
emitter.offAll("namespace");

emitter.emit("test", "nothing will be logged");

// a priority property can be added to the end of the paramters
emitter.on("test3", "namespace", () => {
    console.log("this will be logged last");
}, Emitter.LOW_PRIORITY);

emitter.on("test3", "namespace", () => {
    console.log("this will be logged first");
}, Emitter.HIGH_PRIORITY);

emitter.emit("test3");
// this will be logged first
// this will be logged last

// once registrations do not have a priority, because the event will only execute once
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

Published under the [LGPL-2.1](LICENSE) license.

Published by **MDaemon Technologies, Ltd.**  
Simple Secure Email  
[https://www.mdaemon.com](https://www.mdaemon.com)
