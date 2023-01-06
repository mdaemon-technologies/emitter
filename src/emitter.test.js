const Emitter = require("../dist/emitter.cjs");

describe("Emitter tests", () => {
  let emitter = new Emitter();

  describe("Emitter has method register", () => {
    it("is a function", () => {
      expect(typeof emitter.register).toBe("function");
    });

    it("returns undefined", done => {
      expect(emitter.register()).toBe(undefined);
      expect(emitter.register("test1", output => {
        expect(output).toBe(true);
        emitter.unregister("test1");
        done();
      })).toBe(undefined);

      emitter.trigger("test1", true);
    });

    it("creates an event", done => {
      emitter.register("test2", output => {
        expect(output).toBe(true);
        emitter.unregister("test2");
        done();
      });

      emitter.trigger("test2", true);
    });

    it("accepts an id as a second parameter to allow focused unregister", done => {
      emitter.register("test3", "1", output => {
        if (output) {
          emitter.unregister("test3", "1");
          expect(true).toBe(true);
          done();
          return;
        }

        emitter.unregister("test3", "2");

        emitter.trigger("test3", true);
      });

      emitter.trigger("test3", false);
    });
  });

  describe("Emitter has method on", () => {
    it("is a function", () => {
      expect(typeof emitter.on).toBe("function");
    });

    it("is an alias for register", () => {
      expect(emitter.register === emitter.on).toBe(true);
    });
  });

  describe("Emitter has method subscribe", () => {
    it("is a function", () => {
      expect(typeof emitter.subscribe).toBe("function");
    });

    it("is an alias for register", () => {
      expect(emitter.register === emitter.subscribe).toBe(true);
    });
  });

  describe("Emitter has method once", () => {
    it("is a function", () => {
      expect(typeof emitter.once).toBe("function");
    });

    it("creates a one use event", done => {
      emitter.once("test4", output => {
        expect(output).toBe(true);
        if (output) {
          done();
        }
      });

      expect(emitter.isRegistered("test4")).toBe(true);

      emitter.emit("test4", true);

      emitter.emit("test4", false);
    });
  });

  describe("Emitter has method onMany", () => {
    it("is a function", () => {
      expect(typeof emitter.onMany).toBe("function");
    });

    it("accepts an object of events", done => {
      emitter.onMany("temp", {
        "test5": out => { expect(out).toBe(true); emitter.offAll("temp"); done(); },
        "test6": out => { expect(out).toBe(true); }
      });

      emitter.emit("test6", true);
      emitter.emit("test5", true);
    });
  });

  describe("Emitter has method unregister", () => {
    it("is a function", () => {
      expect(typeof emitter.unregister).toBe("function");
    });

    it("removes events from the events array and the oneTime array", () => {
      emitter.on("test7", () => {});
      expect(emitter.isRegistered("test7")).toBe(true);
      emitter.unregister("test7");
      expect(emitter.isRegistered("test7")).toBe(false);

      emitter.once("test8", () => {});
      expect(emitter.isRegistered("test8")).toBe(true);
      emitter.unregister("test8");
      expect(emitter.isRegistered("test8")).toBe(false);

      emitter.on("test9", "someId", () => {});
      expect(emitter.isRegistered("test9", "someId")).toBe(true);
      emitter.unregister("test9", "someId");
      expect(emitter.isRegistered("test9", "someId")).toBe(false);
    });
  });

  describe("Emitter has method off", () => {
    it("is a function", () => {
      expect(typeof emitter.off).toBe("function");
    });

    it("is an alias for unregister", () => {
      expect(emitter.unregister === emitter.off).toBe(true);
    });
  });

  describe("Emitter has method unsubscribe", () => {
    it("is a function", () => {
      expect(typeof emitter.unsubscribe).toBe("function");
    });

    it("is an alias for unregister", () => {
      expect(emitter.unregister === emitter.unsubscribe).toBe(true);
    });
  });

  describe("Emitter has method offAll", () => {
    it("is a function", () => {
      expect(typeof emitter.offAll).toBe("function");
    });

    it("removes all events of the matching id from the events array", () => {
      emitter.on("test10", "removeId", () => {});
      emitter.on("test11", "removeId", () => {});

      expect(emitter.isRegistered("test10", "removeId")).toBe(true);
      expect(emitter.isRegistered("test11", "removeId")).toBe(true);

      emitter.offAll("removeId");

      expect(emitter.isRegistered("test10", "removeId")).toBe(false);
      expect(emitter.isRegistered("test11", "removeId")).toBe(false);
    });
  });

  describe("Emitter has method trigger", () => {
    it("is a function", () => {
      expect(typeof emitter.trigger).toBe("function");
    });

    it("triggers an event", done => {
      emitter.once("test12", out => {
        expect(out).toBe(true);
        done();
      });

      emitter.trigger("test12", true);
    });
  });

  describe("Emitter has method emit", () => {
    it("is a function", () => {
      expect(typeof emitter.emit).toBe("function");
    });

    it("is an alias for trigger", () => {
      expect(emitter.trigger === emitter.emit).toBe(true);
    });
  });

  describe("Emitter has method publish", () => {
    it("is a function", () => {
      expect(typeof emitter.emit).toBe("function");
    });

    it("is an alias for trigger", () => {
      expect(emitter.trigger === emitter.publish).toBe(true);
    });
  });

  describe("Emitter has method propagate", () => {
    it("is a function", () => {
      expect(typeof emitter.propagate).toBe("function");
    });

    it("triggers 'trigger' with data as the first parameter", done => {
      emitter.once("test13", out => {
        expect(out).toBe(true);
        done();
      });

      emitter.propagate(true, "test13");
    });
  });

  describe("Emitter has method isRegistered", () => {
    it("is a function", () => {
      expect(typeof emitter.isRegistered).toBe("function");
    });

    it("tests for registered events", () => {
      emitter.once("test14", () => {});
      emitter.on("test15", () => { });
      emitter.on("test16", "testID", () => {});

      expect(emitter.isRegistered("test14")).toBe(true);
      expect(emitter.isRegistered("test15")).toBe(true);
      expect(emitter.isRegistered("test16", "testID")).toBe(true);

      emitter.off("test14");
      emitter.off("test15");
      emitter.off("test16", "testID");

      expect(emitter.isRegistered("test14")).toBe(false);
      expect(emitter.isRegistered("test15")).toBe(false);
      expect(emitter.isRegistered("test16", "testID")).toBe(false);
    });
  });
});