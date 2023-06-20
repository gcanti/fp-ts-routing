---
title: matcher.ts
nav_order: 4
parent: Modules
---

## matcher overview

Added in v0.6.0

---

<h2 class="text-delta">Table of contents</h2>

- [matchers](#matchers)
  - [IntegerFromString](#integerfromstring)
  - [Match (class)](#match-class)
    - [imap (method)](#imap-method)
    - [then (method)](#then-method)
    - [\_A (property)](#_a-property)
  - [end](#end)
  - [imap](#imap)
  - [int](#int)
  - [lit](#lit)
  - [query](#query)
  - [str](#str)
  - [succeed](#succeed)
  - [then](#then)
  - [type](#type)

---

# matchers

## IntegerFromString

**Signature**

```ts
export declare const IntegerFromString: Type<number, string, unknown>
```

Added in v0.4.2

## Match (class)

**Signature**

```ts
export declare class Match<A> {
  constructor(readonly parser: Parser<A>, readonly formatter: Formatter<A>)
}
```

Added in v0.4.0

### imap (method)

**Signature**

```ts
imap<B>(f: (a: A) => B, g: (b: B) => A): Match<B>
```

Added in v0.4.0

### then (method)

**Signature**

```ts
then<B>(that: Match<B> & Match<RowLacks<B, keyof A>>): Match<A & B>
```

Added in v0.4.0

### \_A (property)

**Signature**

```ts
readonly _A: A
```

Added in v0.4.0

## end

`end` matches the end of a route

**Signature**

```ts
export declare const end: Match<{}>
```

Added in v0.4.0

## imap

**Signature**

```ts
export declare const imap: <A, B>(f: (a: A) => B, g: (b: B) => A) => (ma: Match<A>) => Match<B>
```

Added in v0.5.1

## int

`int` matches any integer path component

**Signature**

```ts
export declare const int: <K extends string>(k: K) => Match<{ [_ in K]: number }>
```

**Example**

```ts
import { int, Route } from 'fp-ts-routing'
import { some, none } from 'fp-ts/lib/Option'

assert.deepStrictEqual(int('id').parser.run(Route.parse('/1')), some([{ id: 1 }, new Route([], {})]))
assert.deepStrictEqual(int('id').parser.run(Route.parse('/a')), none)
```

Added in v0.4.0

## lit

`lit(x)` will match exactly the path component `x`

**Signature**

```ts
export declare const lit: (literal: string) => Match<{}>
```

**Example**

```ts
import { lit, Route } from 'fp-ts-routing'
import { some, none } from 'fp-ts/lib/Option'

assert.deepStrictEqual(lit('subview').parser.run(Route.parse('/subview/')), some([{}, new Route([], {})]))
assert.deepStrictEqual(lit('subview').parser.run(Route.parse('/')), none)
```

Added in v0.4.0

## query

Will match a querystring.

**Note**. Use `io-ts`'s `strict` instead of `type` otherwise excess properties won't be removed.

**Signature**

```ts
export declare const query: <A>(type: Type<A, Record<string, QueryValues>, unknown>) => Match<A>
```

**Example**

```ts
import * as t from 'io-ts'
import { lit, str, query, Route } from 'fp-ts-routing'

const route = lit('accounts')
  .then(str('accountId'))
  .then(lit('files'))
  .then(query(t.strict({ pathparam: t.string })))
  .formatter.run(Route.empty, { accountId: 'testId', pathparam: '123' })
  .toString()

assert.strictEqual(route, '/accounts/testId/files?pathparam=123')
```

Added in v0.4.0

## str

`str` matches any string path component

**Signature**

```ts
export declare const str: <K extends string>(k: K) => Match<{ [_ in K]: string }>
```

**Example**

```ts
import { str, Route } from 'fp-ts-routing'
import { some, none } from 'fp-ts/lib/Option'

assert.deepStrictEqual(str('id').parser.run(Route.parse('/abc')), some([{ id: 'abc' }, new Route([], {})]))
assert.deepStrictEqual(str('id').parser.run(Route.parse('/')), none)
```

Added in v0.4.0

## succeed

`succeed` matches everything but consumes nothing

**Signature**

```ts
export declare const succeed: <A>(a: A) => Match<A>
```

Added in v0.4.0

## then

**Signature**

```ts
export declare const then: <B>(mb: Match<B>) => <A>(ma: Match<A> & Match<RowLacks<A, keyof B>>) => Match<A & B>
```

Added in v0.5.1

## type

`type` matches any io-ts type path component

**Signature**

```ts
export declare const type: <K extends string, A>(k: K, type: Type<A, string, unknown>) => Match<{ [_ in K]: A }>
```

**Example**

```ts
import * as t from 'io-ts'
import { lit, type, Route } from 'fp-ts-routing'
import { some, none } from 'fp-ts/lib/Option'

const T = t.keyof({
  a: null,
  b: null
})

const match = lit('search').then(type('topic', T))

assert.deepStrictEqual(match.parser.run(Route.parse('/search/a')), some([{ topic: 'a' }, Route.empty]))
assert.deepStrictEqual(match.parser.run(Route.parse('/search/b')), some([{ topic: 'b' }, Route.empty]))
assert.deepStrictEqual(match.parser.run(Route.parse('/search/')), none)
```

Added in v0.4.0
