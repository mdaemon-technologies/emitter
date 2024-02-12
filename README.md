![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmdaemon-technologies%2Femitter%2Fmain%2Fpackage.json&query=%24.version&prefix=v&label=npm&color=blue) [![install size](https://packagephobia.com/badge?p=@mdaemon/emitter)](https://packagephobia.com/result?p=@mdaemon/emitter) ![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmdaemon-technologies%2Femitter%2Fmain%2Fpackage.json&query=%24.license&prefix=v&label=license&color=green) [![codecov](https://codecov.io/gh/mdaemon-technologies/emitter/graph/badge.svg?token=DVMZPN8RQ6)](https://codecov.io/gh/mdaemon-technologies/emitter)

# @mdaemon/emitter, A Dependency Free event emitter library
[ [@mdaemon/emitter on npm](https://www.npmjs.com/package/@mdaemon/emitter "npm") ]


The "emitter" provides pub/sub options

# Install #

	  $ npm install @mdaemon/emitter --save  

# Node CommonJS #
```javascript
    const Emitter = require("@mdaemon/emitter/dist/emitter.cjs");
```

# Node Modules #

```javascript
    import Emitter from "@mdaemon/emitter/dist/emitter.mjs";  
```

# Web #
```HTML
    <script type="text/javascript" src="/path_to_modules/dist/emitter.umd.js">
```

### Emitter ###

```javascript
    /* this is more typically used as a prototype for a class or object
     * class Messages extends Emitter {}
     *
     * or
     * 
     * function Messages() { 
     *   Object.assign(this, new Emitter());
     * }
     */

    const emitter = new Emitter();

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

    // your flavor of pub/sub may vary
    // emitter.register === emitter.on === emitter.subscribe 
    // emitter.unregister === emitter.off === emitter.unsubscribe
    // emitter.trigger === emitter.emit === emitter.publish

    emitter.once("only-receive-this-once", (input) => {
        console.log(input); 
    });

    emitter.trigger("only-receive-this-once", "this was received once, and then removed from memory");
    // this was received once, and then removed from memory

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

```

# License #

Published under the [LGPL-2.1 license](https://github.com/mdaemon-technologies/event_emitter/blob/main/LICENSE "LGPL-2.1 License").