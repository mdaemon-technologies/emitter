# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2026-10-26

### Security

- Wildcard matching no longer uses a regular expression. A pattern with several
  stars, such as `*a*a*a*b`, backtracked polynomially, so emitting a long name
  that did not match could block the thread for seconds or minutes (3.8 s for
  a 400-character name with four stars). Matching now takes time proportional
  to the pattern length times the name length, however many wildcards the
  pattern holds.

### Added

- Releases are published from GitHub Actions when a GitHub Release is created,
  using npm trusted publishing (OIDC, no stored npm token) and staged
  publishing, so each version is approved with 2FA before it is public. The
  workflow pins its actions to commit SHAs and npm to an exact version, does
  not restore the npm cache, and does not leave the GitHub token in the
  checkout.

### Changed

- `*` and `?` now match line breaks in an emitted name. Previously `user.*` did
  not match `"user.a\nb"`.
- CI uses `actions/checkout` and `actions/setup-node` v7, pinned to commit SHAs.

### Fixed

- `dist/emitter.cjs.d.ts`, `dist/emitter.mjs.d.ts` and `dist/emitter.umd.d.ts`
  now re-export the `WarningHandler` and `ErrorHandler` types, matching
  `dist/emitter.d.ts`.

## [3.0.1] - 2026-09-21

No code changes.

### Changed

- `package.json` declares `"engines": { "node": ">=18" }`, the oldest Node
  version CI tests.
- The README imports the package by name (`import Emitter from "@mdaemon/emitter"`,
  `require("@mdaemon/emitter")`) instead of by a path into `dist/`, which Node
  has rejected since 2.0.9. Version history moved from the README to this
  changelog.

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

## [2.1.1] - 2026-05-19

### Added

- A `types` condition in the `exports` map, so TypeScript finds the typings
  when it resolves the package through `exports`.

### Changed

- `dist/emitter.cjs.d.ts` re-exports the real declarations (the default
  `Emitter` plus `Callback`, `IEmitterConfig` and `IEvent`) instead of declaring
  an empty ambient module.
- Removed the `browser` field from `package.json`. `main` still points at the
  UMD bundle.
- CI tests on Node 18, 20, 22, 24 and 26 instead of 14 through 22.

## [2.1.0] - 2026-05-18

The bundles are unchanged; this release only changes the typings.

### Added

- `dist/emitter.d.ts` exports the `Callback`, `IEmitterConfig` and `IEvent`
  types.
- Typings for the constructor, `config`, `getEvents` and `triggerOneTime`.

### Changed

- `register`, `on` and `subscribe` are typed as one overload per argument form,
  `(name, func, priority?)`, `(name, namespace, func, priority?)` and
  `(name, func, namespace)`, instead of one loosely typed signature. `onMany`
  takes `{ [key: string]: Callback }` instead of `any`.
- `dist/emitter.mjs.d.ts` and `dist/emitter.umd.d.ts` re-export the real
  declarations instead of declaring empty ambient modules.

### Fixed

- The namespace argument of `isRegistered` is optional in the typings, matching
  the code.

## [2.0.10] - 2026-05-18

### Fixed

- The `require` condition in the `exports` map points at `dist/emitter.cjs`.
  In 2.0.9 it pointed at the UMD bundle.

## [2.0.9] - 2026-05-18

### Added

- An `exports` map in `package.json`, so `import Emitter from "@mdaemon/emitter"`
  loads `dist/emitter.mjs` and `require("@mdaemon/emitter")` loads a CommonJS
  build.

### Changed

- **Breaking in a patch release:** with an `exports` map in place, Node no
  longer resolves paths into the package, so
  `require("@mdaemon/emitter/dist/emitter.cjs")` and
  `import Emitter from "@mdaemon/emitter/dist/emitter.mjs"`, the forms the README
  documented until 3.0.1, fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`. Import the
  package by name instead.

## [2.0.8] - 2025-07-24

### Fixed

- The typings declare the static `HIGH_PRIORITY`, `NORMAL_PRIORITY` and
  `LOW_PRIORITY` constants.

## [2.0.7] - 2025-04-24

### Changed

- Updated development dependencies, including Rollup 2 to 4. The published
  bundles are unchanged.

## [2.0.6] - 2025-03-14

### Changed

- Updated development dependencies. The published bundles are unchanged.

## [2.0.5] - 2024-10-08

### Fixed

- `typings` in `package.json` points at `dist/emitter.d.ts`. 2.0.4 renamed the
  declaration file but left `typings` pointing at the old name, so TypeScript
  found no declarations for that release.

## [2.0.4] - 2024-10-08

### Fixed

- The declaration file uses `export default`, matching the bundles, instead of
  `export =`. It is renamed from `dist/index.d.ts` to `dist/emitter.d.ts`.

## [2.0.3] - 2024-09-20

### Added

- A `config` getter, with no setter, that returns the emitter's configuration.

### Changed

- The internal fields are renamed `_emitter_config`, `_emitter_events` and
  `_emitter_oneTime` (previously `config`, `events` and `oneTime`), so they are
  less likely to collide with a subclass's own fields or with an object that
  copies an emitter in through `Object.assign(this, new Emitter())`.

## [2.0.2] - 2024-09-19

### Fixed

- The namespace argument of `unregister`, `off` and `unsubscribe` is optional
  again in the typings. 2.0.1 had made it required.

## [2.0.1] - 2024-09-19

### Fixed

- The typings for `register`, `on` and `subscribe` accept the priority
  argument.
- Removed the default values from the `unregister`, `off` and `unsubscribe`
  declarations; a declaration file cannot contain them.

## [2.0.0] - 2024-09-12

### Changed

- Converted to TypeScript and ES6 modules.

[3.1.0]: https://www.npmjs.com/package/@mdaemon/emitter/v/3.1.0
[3.0.1]: https://www.npmjs.com/package/@mdaemon/emitter/v/3.0.1
[3.0.0]: https://www.npmjs.com/package/@mdaemon/emitter/v/3.0.0
[2.1.1]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.1.1
[2.1.0]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.1.0
[2.0.10]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.10
[2.0.9]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.9
[2.0.8]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.8
[2.0.7]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.7
[2.0.6]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.6
[2.0.5]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.5
[2.0.4]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.4
[2.0.3]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.3
[2.0.2]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.2
[2.0.1]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.1
[2.0.0]: https://www.npmjs.com/package/@mdaemon/emitter/v/2.0.0
