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
