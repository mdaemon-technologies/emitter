# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-09-09

A correctness pass over the emitter. Several of these change observable
behaviour, so this is a breaking release. Every fix below has a regression test
in `src/emitter.test.ts`.

### Added

- `onWarning(message)` config option, called when a listener is turned away for
  exceeding a limit. Defaults to `console.warn`. Previously the limit was
  enforced silently apart from a hard-coded console warning, with no way for a
  caller to observe it.
- `onError(error, name)` config option, called when a handler throws. Defaults
  to `console.error`.
- `once(name, namespace, func)`, so a one-time handler can be scoped and cleaned
  up by `unregister` or `offAll` before it fires.
- Wildcard matching and the multiple-handler semantics are now documented in the
  README.

### Changed

- **BREAKING:** Registering more than once against the same name and namespace
  now keeps every handler instead of replacing the previous one. Handlers that
  were previously replaced now accumulate toward `maxListeners`; a caller that
  re-subscribes on every render will reach the limit where it previously stayed
  at one listener.
- **BREAKING:** Registering without a function now throws a `TypeError` at the
  call site. Previously the registration was accepted and failed later, during
  an unrelated `trigger`, with `evs[idx].func is not a function`.
- **BREAKING:** Exceptions thrown by handlers no longer propagate out of
  `trigger`. Code wrapping `trigger` in `try`/`catch` to observe handler errors
  should use the `onError` option instead.
- **BREAKING:** `emitter.config` is frozen. Assigning to one of its fields is
  ignored in sloppy mode and throws in strict mode.
- **BREAKING:** `unregister(name)` removes one-time handlers in the `'all'`
  namespace rather than every one-time handler with that name. Handlers
  registered through `once(name, namespace, func)` are removed by passing that
  namespace, or by `offAll`.
- One-time handlers fire in registration order. They previously fired in reverse
  registration order, as a side effect of the loop that removed them.
- `IEmitterConfig` fields are declared `readonly`, so mutation is now a
  compile-time error as well as a runtime no-op.
- A name's matcher is compiled once at registration instead of being rebuilt for
  every registered listener on every emit.
- The wildcard matching that had been duplicated between `getEvents` and
  `triggerOneTime` (and had drifted apart, causing the `?` bug) is now a single
  `EmitterEvent.matches`.
- The two near-identical listener-limit checks, whose copy-paste caused the
  `maxOnceListeners` bug, are now one `reachedMax` helper that takes the limit
  as an argument.
- The `Event` constructor function, which shadowed the DOM global and duplicated
  the `IEvent` shape, is now `class EmitterEvent implements IEvent`. The source
  type-checks cleanly under `--strict`, which previously reported six errors.

### Fixed

- **One-time handlers no longer crash the emit that removes them.**
  `triggerOneTime` iterated the live queue while calling handlers and spliced
  from it, so any handler that unregistered a listener shifted the indices
  underneath the loop and threw
  `TypeError: Cannot read properties of undefined (reading 'name')`. Matching
  handlers are now detached from the queue before any of them is called.
- **Event names are escaped before being compiled into matchers.** A name such
  as `a(b*` produced an invalid regular expression. Because every emit tests
  every registered name, a single listener with a stray `(`, `[`, or `+` broke
  *all* emits on that emitter, not just its own.
- **`maxOnceListeners` is now read.** `reachedMaxOnceListeners` checked
  `maxListeners` instead, so the one-time limit had never had any effect.
- **Subclass method overrides are honoured.** Every method was an arrow-function
  class field, which shadowed any subclass prototype method of the same name;
  an override was silently ignored with no error. Methods now live on the
  prototype and are bound in the constructor, so overrides are picked up while
  detached references keep working.
- **Registering twice no longer discards the first handler.** `register`
  replaced any existing handler for the same name and namespace, so two
  listeners added without an explicit namespace collapsed into one. This also
  silently broke the priority example in this project's own README, which
  documents two output lines but only ever produced one.
- **`?` behaves the same on both trigger paths.** `getEvents` tested for `?` but
  never substituted it, so it kept its regular-expression meaning for
  `on`/`register` handlers while `once` handlers treated it as a wildcard.
- **Wildcard matches are anchored.** `user.*` matched `superuser.created`, and
  `.` was treated as a regular-expression wildcard. Both are now literal, and
  the whole name must match.
- **A partial config no longer disables the limits.** `new Emitter({ maxListeners: 10 })`
  left `maxOnceListeners` undefined, making every comparison against it false.
  Each field now falls back independently, and a non-numeric value is rejected.
- **A throwing handler no longer aborts the emit.** One handler that threw
  prevented every later handler from seeing the event and surfaced the
  exception at the unrelated `trigger` call site. Handlers are now isolated and
  errors are reported to `onError`.
- **One-time handlers take part in the namespace system.** `once` hardcoded an
  empty namespace, so `offAll` could never remove a one-time handler that never
  fired, and `isRegistered(name, namespace)` returned true for one regardless of
  the namespace given.
- **`config` is immutable, as documented.** The getter returned the internal
  object by reference, so `emitter.config.maxListeners = 1` took effect.
- **Corrected the `unregister` documentation.** It claimed that a namespace of
  `'all'` removed every handler for an event name. `'all'` is the default
  namespace, not a wildcard.

## [2.0.0] - 2024-09-12

### Changed

- Converted to TypeScript and ES6 modules.

[3.0.0]: https://www.npmjs.com/package/@mdaemon/emitter/v/3.0.0
[2.0.0]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.0
