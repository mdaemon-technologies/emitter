import Emitter from './emitter';

describe('Emitter', () => {
  let emitter: Emitter;

  beforeEach(() => {
    emitter = new Emitter();
  });

  test('should register an event with a name and namespace', () => {
    const callback = jest.fn();
    emitter.on('test.namespace', callback);
    expect(emitter.isRegistered('test.namespace')).toBe(true);
  });

  test('should unregister an event', () => {
    const callback = jest.fn();
    emitter.on('test.namespace', callback);
    emitter.off('test.namespace');
    expect(emitter.isRegistered('test.namespace')).toBe(false);
  });

  test('should unregister all events for a given name and namespace', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    emitter.on('test.namespace', callback1);
    emitter.on('test.namespace', callback2);
    emitter.off('test.namespace');
    expect(emitter.isRegistered('test.namespace')).toBe(false);
  });

  test('should not throw error when unregistering non-existent event', () => {
    expect(() => emitter.off('non.existent')).not.toThrow();
  });

  test('should register multiple events with different namespaces', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    emitter.on('test.namespace1', callback1);
    emitter.on('test.namespace2', callback2);
    expect(emitter.isRegistered('test.namespace1')).toBe(true);
    expect(emitter.isRegistered('test.namespace2')).toBe(true);
  });
});

describe('Emitter regressions', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('one-time handlers are detached before they are called', () => {
    test('a handler that unregisters the event does not crash the emit', () => {
      const emitter = new Emitter();
      const order: string[] = [];

      emitter.once('evt', () => { order.push('first'); });
      emitter.once('evt', () => { order.push('second'); emitter.unregister('evt'); });
      emitter.once('evt', () => { order.push('third'); });

      expect(() => emitter.trigger('evt', null)).not.toThrow();
      expect(order).toEqual(['first', 'second', 'third']);
      expect(emitter.isRegistered('evt')).toBe(false);
    });

    test('a handler that registers a new one-time handler does not re-enter this emit', () => {
      const emitter = new Emitter();
      const calls: string[] = [];

      emitter.once('evt', () => {
        calls.push('outer');
        emitter.once('evt', () => { calls.push('inner'); });
      });

      emitter.trigger('evt', null);
      expect(calls).toEqual(['outer']);

      emitter.trigger('evt', null);
      expect(calls).toEqual(['outer', 'inner']);
    });

    test('one-time handlers fire in registration order and only once', () => {
      const emitter = new Emitter();
      const calls: string[] = [];

      emitter.once('evt', () => calls.push('a'));
      emitter.once('evt', () => calls.push('b'));

      emitter.trigger('evt', null);
      emitter.trigger('evt', null);

      expect(calls).toEqual(['a', 'b']);
    });
  });

  describe('event names are escaped before becoming matchers', () => {
    test('regex metacharacters in a wildcard name do not throw', () => {
      const emitter = new Emitter();
      emitter.on('a(b*', () => { });
      emitter.once('price[usd]*', () => { });

      expect(() => emitter.trigger('unrelated', null)).not.toThrow();
    });

    test('metacharacters are matched literally', () => {
      const emitter = new Emitter();
      const hits: string[] = [];
      emitter.on('price(usd)*', () => hits.push('on'));

      emitter.trigger('price(usd)-changed', null);
      expect(hits).toEqual(['on']);

      emitter.trigger('priceXusdY-changed', null);
      expect(hits).toEqual(['on']);
    });
  });

  describe('maxOnceListeners is honoured independently of maxListeners', () => {
    test('a large maxOnceListeners is not capped by a small maxListeners', () => {
      const emitter = new Emitter({ maxListeners: 2, maxOnceListeners: 10 });
      const calls: number[] = [];

      for (let i = 0; i < 5; i += 1) {
        emitter.once('evt', () => calls.push(i));
      }

      emitter.trigger('evt', null);
      expect(calls).toEqual([0, 1, 2, 3, 4]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('maxOnceListeners caps one-time handlers', () => {
      const emitter = new Emitter({ maxListeners: 10, maxOnceListeners: 2 });
      const calls: number[] = [];

      for (let i = 0; i < 5; i += 1) {
        emitter.once('evt', () => calls.push(i));
      }

      emitter.trigger('evt', null);
      expect(calls).toEqual([0, 1]);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('the class can be extended and its methods stay detachable', () => {
    test('a subclass override is invoked, including through an alias', () => {
      const seen: string[] = [];

      class Messages extends Emitter {
        trigger(name: string, data?: any): void {
          seen.push('override');
          super.trigger(name, data);
        }
      }

      const messages = new Messages();
      messages.on('evt', () => seen.push('handler'));

      messages.trigger('evt', null);
      expect(seen).toEqual(['override', 'handler']);

      messages.emit('evt', null);
      expect(seen).toEqual(['override', 'handler', 'override', 'handler']);
    });

    test('aliases remain the same function reference', () => {
      const emitter = new Emitter();
      expect(emitter.on).toBe(emitter.register);
      expect(emitter.subscribe).toBe(emitter.register);
      expect(emitter.off).toBe(emitter.unregister);
      expect(emitter.unsubscribe).toBe(emitter.unregister);
      expect(emitter.emit).toBe(emitter.trigger);
      expect(emitter.publish).toBe(emitter.trigger);
    });

    test('propagate works when passed detached to another emitter', () => {
      const source = new Emitter();
      const target = new Emitter();
      const received: any[] = [];

      target.on('evt', (data: any) => received.push(data));
      source.on('evt', target.propagate);

      source.trigger('evt', 'payload');
      expect(received).toEqual(['payload']);
    });

    test('Object.assign composition still produces a working emitter', () => {
      const composed: any = {};
      Object.assign(composed, new Emitter());

      const received: any[] = [];
      composed.on('evt', (data: any) => received.push(data));
      composed.trigger('evt', 'payload');

      expect(received).toEqual(['payload']);
    });
  });

  describe('registering twice keeps both handlers', () => {
    test('two handlers on the default namespace both fire', () => {
      const emitter = new Emitter();
      const calls: string[] = [];

      emitter.on('evt', () => calls.push('first'));
      emitter.on('evt', () => calls.push('second'));

      emitter.trigger('evt', null);
      expect(calls).toEqual(['first', 'second']);
    });

    test('two handlers on the same explicit namespace both fire and both unregister', () => {
      const emitter = new Emitter();
      const calls: string[] = [];

      emitter.on('evt', 'ns', () => calls.push('first'));
      emitter.on('evt', 'ns', () => calls.push('second'));

      emitter.trigger('evt', null);
      expect(calls).toEqual(['first', 'second']);

      emitter.off('evt', 'ns');
      emitter.trigger('evt', null);
      expect(calls).toEqual(['first', 'second']);
      expect(emitter.isRegistered('evt', 'ns')).toBe(false);
    });

    test('priority ordering is preserved across duplicate registrations', () => {
      const emitter = new Emitter();
      const calls: string[] = [];

      emitter.on('evt', 'a', () => calls.push('low'), Emitter.LOW_PRIORITY);
      emitter.on('evt', 'b', () => calls.push('high'), Emitter.HIGH_PRIORITY);
      emitter.on('evt', 'c', () => calls.push('normal'));
      emitter.on('evt', 'd', () => calls.push('high2'), Emitter.HIGH_PRIORITY);

      emitter.trigger('evt', null);
      expect(calls).toEqual(['high', 'high2', 'normal', 'low']);
    });
  });

  describe('wildcards behave the same on both trigger paths', () => {
    test('"?" matches exactly one character for on() and once()', () => {
      const emitter = new Emitter();
      const hits: string[] = [];

      emitter.on('te?t', () => hits.push('on'));
      emitter.once('te?t', () => hits.push('once'));

      emitter.trigger('test', null);
      expect(hits.sort()).toEqual(['on', 'once']);
    });

    test('"?" does not match an empty character for either path', () => {
      const emitter = new Emitter();
      const hits: string[] = [];

      emitter.on('te?t', () => hits.push('on'));
      emitter.once('te?t', () => hits.push('once'));

      emitter.trigger('tet', null);
      expect(hits).toEqual([]);
    });

    test('"*" matches a run of characters for both paths', () => {
      const emitter = new Emitter();
      const hits: string[] = [];

      emitter.on('user.*', () => hits.push('on'));
      emitter.once('user.*', () => hits.push('once'));

      emitter.trigger('user.created', null);
      expect(hits.sort()).toEqual(['on', 'once']);
    });
  });

  describe('wildcard matches are anchored', () => {
    test('a leading wildcard does not match a longer prefix', () => {
      const emitter = new Emitter();
      const hits: string[] = [];

      emitter.on('user.*', () => hits.push('on'));
      emitter.once('user.*', () => hits.push('once'));

      emitter.trigger('superuser.created', null);
      expect(hits).toEqual([]);
    });

    test('a dot is matched literally', () => {
      const emitter = new Emitter();
      const hits: string[] = [];

      emitter.on('test.*', () => hits.push('on'));

      emitter.trigger('testXfoo', null);
      expect(hits).toEqual([]);

      emitter.trigger('test.foo', null);
      expect(hits).toEqual(['on']);
    });

    test('a trailing wildcard does not match a longer suffix', () => {
      const emitter = new Emitter();
      const hits: string[] = [];

      emitter.on('*.created', () => hits.push('on'));

      emitter.trigger('user.created.late', null);
      expect(hits).toEqual([]);

      emitter.trigger('user.created', null);
      expect(hits).toEqual(['on']);
    });
  });

  describe('config falls back to defaults', () => {
    test('an omitted config uses the defaults', () => {
      const config = new Emitter().config;
      expect(config.maxListeners).toBe(50);
      expect(config.maxOnceListeners).toBe(50);
    });

    test('a partial config keeps the supplied value and defaults the rest', () => {
      const emitter = new Emitter({ maxListeners: 7 });
      expect(emitter.config.maxListeners).toBe(7);
      expect(emitter.config.maxOnceListeners).toBe(50);
    });

    test('an empty config object uses the defaults', () => {
      const config = new Emitter({}).config;
      expect(config.maxListeners).toBe(50);
      expect(config.maxOnceListeners).toBe(50);
    });

    test('a non-numeric limit falls back to the default', () => {
      const emitter = new Emitter({ maxListeners: 'lots' as any });
      expect(emitter.config.maxListeners).toBe(50);
    });

    test('a partial config still enforces the defaulted limit', () => {
      const emitter = new Emitter({ maxListeners: 1 });
      const calls: number[] = [];

      for (let i = 0; i < 60; i += 1) {
        emitter.once('evt', () => calls.push(i));
      }

      emitter.trigger('evt', null);
      expect(calls.length).toBe(50);
    });
  });

  describe('config is immutable once set', () => {
    test('the config object is frozen and keeps its values', () => {
      const emitter = new Emitter({ maxListeners: 5 });

      expect(Object.isFrozen(emitter.config)).toBe(true);

      try {
        (emitter.config as any).maxListeners = 1;
      }
      catch (error) {
        /* Strict mode throws rather than ignoring the write. */
      }

      expect(emitter.config.maxListeners).toBe(5);
    });

    test('the limit is still enforced after an attempted mutation', () => {
      const warnings: string[] = [];
      const emitter = new Emitter({ maxListeners: 1, onWarning: (m) => warnings.push(m) });

      try {
        (emitter.config as any).maxListeners = 99;
      }
      catch (error) {
        /* Strict mode throws rather than ignoring the write. */
      }

      emitter.on('evt', 'a', () => { });
      emitter.on('evt', 'b', () => { });

      expect(warnings).toHaveLength(1);
    });
  });

  describe('limits are reported through the onWarning handler', () => {
    test('a rejected listener is reported to onWarning, not console', () => {
      const warnings: string[] = [];
      const emitter = new Emitter({ maxListeners: 1, onWarning: (m) => warnings.push(m) });

      emitter.on('evt', 'a', () => { });
      emitter.on('evt', 'b', () => { });

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('evt');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('a rejected one-time listener is reported to onWarning', () => {
      const warnings: string[] = [];
      const emitter = new Emitter({ maxOnceListeners: 1, onWarning: (m) => warnings.push(m) });

      emitter.once('evt', () => { });
      emitter.once('evt', () => { });

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('evt');
    });

    test('warnings fall back to console.warn', () => {
      const emitter = new Emitter({ maxListeners: 1 });

      emitter.on('evt', 'a', () => { });
      emitter.on('evt', 'b', () => { });

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('handlers are validated at registration', () => {
    test('a missing handler throws where the caller can see it', () => {
      const emitter = new Emitter();

      expect(() => (emitter as any).on('evt', 'ns')).toThrow(TypeError);
      expect(() => (emitter as any).once('evt')).toThrow(TypeError);
    });

    test('a non-function handler throws', () => {
      const emitter = new Emitter();

      expect(() => (emitter as any).on('evt', 'ns', 'not-a-function')).toThrow(TypeError);
      expect(() => (emitter as any).once('evt', 'ns', 42)).toThrow(TypeError);
    });

    test('a rejected registration leaves nothing behind', () => {
      const emitter = new Emitter();

      expect(() => (emitter as any).on('evt', 'ns')).toThrow();

      expect(emitter.isRegistered('evt', 'ns')).toBe(false);
      expect(() => emitter.trigger('evt', null)).not.toThrow();
    });

    test('onMany rejects an object holding a non-function', () => {
      const emitter = new Emitter();

      expect(() => emitter.onMany('ns', { good: () => { }, bad: 'nope' as any })).toThrow(TypeError);
    });

    test('a rejected onMany registers nothing at all', () => {
      const emitter = new Emitter();

      expect(() => emitter.onMany('ns', { good: () => { }, bad: 'nope' as any })).toThrow();

      expect(emitter.isRegistered('good', 'ns')).toBe(false);
      expect(emitter.isRegistered('bad', 'ns')).toBe(false);
    });
  });

  describe('one-time handlers take part in the namespace system', () => {
    test('once accepts a namespace', () => {
      const emitter = new Emitter();
      const calls: string[] = [];

      emitter.once('evt', 'ns', () => calls.push('once'));

      expect(emitter.isRegistered('evt', 'ns')).toBe(true);
      expect(emitter.isRegistered('evt', 'other')).toBe(false);

      emitter.trigger('evt', null);
      expect(calls).toEqual(['once']);
    });

    test('offAll removes namespaced one-time handlers', () => {
      const emitter = new Emitter();
      const calls: string[] = [];

      emitter.once('evt', 'ns', () => calls.push('once'));
      emitter.offAll('ns');

      expect(emitter.isRegistered('evt', 'ns')).toBe(false);

      emitter.trigger('evt', null);
      expect(calls).toEqual([]);
    });

    test('unregister removes a namespaced one-time handler', () => {
      const emitter = new Emitter();
      const calls: string[] = [];

      emitter.once('evt', 'ns', () => calls.push('once'));
      emitter.unregister('evt', 'ns');

      emitter.trigger('evt', null);
      expect(calls).toEqual([]);
    });

    test('isRegistered does not report a one-time handler under an unrelated namespace', () => {
      const emitter = new Emitter();

      emitter.once('evt', () => { });

      expect(emitter.isRegistered('evt')).toBe(true);
      expect(emitter.isRegistered('evt', 'unrelated')).toBe(false);
    });
  });

  describe('a throwing handler is isolated from the others', () => {
    test('later handlers still run and the emit does not throw', () => {
      const calls: string[] = [];
      const errors: string[] = [];
      const emitter = new Emitter({ onError: (error, name) => errors.push(`${name}:${error.message}`) });

      emitter.on('evt', 'a', () => { throw new Error('boom'); }, Emitter.HIGH_PRIORITY);
      emitter.on('evt', 'b', () => calls.push('b'));
      emitter.on('evt', 'c', () => calls.push('c'));

      expect(() => emitter.trigger('evt', null)).not.toThrow();
      expect(calls).toEqual(['b', 'c']);
      expect(errors).toEqual(['evt:boom']);
    });

    test('a throwing one-time handler does not stop the others', () => {
      const calls: string[] = [];
      const errors: string[] = [];
      const emitter = new Emitter({ onError: (error, name) => errors.push(`${name}:${error.message}`) });

      emitter.once('evt', () => { throw new Error('boom'); });
      emitter.once('evt', () => calls.push('second'));

      expect(() => emitter.trigger('evt', null)).not.toThrow();
      expect(calls).toEqual(['second']);
      expect(errors).toEqual(['evt:boom']);
      expect(emitter.isRegistered('evt')).toBe(false);
    });

    test('a throwing regular handler does not stop the one-time handlers', () => {
      const calls: string[] = [];
      const emitter = new Emitter({ onError: () => { } });

      emitter.on('evt', 'a', () => { throw new Error('boom'); });
      emitter.once('evt', () => calls.push('once'));

      emitter.trigger('evt', null);
      expect(calls).toEqual(['once']);
    });

    test('errors fall back to console.error', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
      const emitter = new Emitter();

      emitter.on('evt', 'a', () => { throw new Error('boom'); });
      expect(() => emitter.trigger('evt', null)).not.toThrow();
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });
});
