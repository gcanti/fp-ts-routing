---
title: index.ts
nav_order: 1
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Query (interface)](#query-interface)
- [QueryValues (type alias)](#queryvalues-type-alias)
- [RowLacks (type alias)](#rowlacks-type-alias)
- [Formatter (class)](#formatter-class)
  - [contramap (method)](#contramap-method)
  - [then (method)](#then-method)
- [Match (class)](#match-class)
  - [imap (method)](#imap-method)
  - [then (method)](#then-method-1)
- [Parser (class)](#parser-class)
  - [of (static method)](#of-static-method)
  - [map (method)](#map-method)
  - [ap (method)](#ap-method)
  - [chain (method)](#chain-method)
  - [alt (method)](#alt-method)
  - [then (method)](#then-method-2)
- [Route (class)](#route-class)
  - [isEmpty (static method)](#isempty-static-method)
  - [parse (static method)](#parse-static-method)
  - [toString (method)](#tostring-method)
- [end (constant)](#end-constant)
- [format (function)](#format-function)
- [getParserMonoid (function)](#getparsermonoid-function)
- [getParserSemigroup (function)](#getparsersemigroup-function)
- [int (function)](#int-function)
- [lit (function)](#lit-function)
- [parse (function)](#parse-function)
- [query (function)](#query-function)
- [str (function)](#str-function)
- [succeed (function)](#succeed-function)
- [type (function)](#type-function)
- [zero (function)](#zero-function)

---

# Query (interface)

**Signature**

```ts
export interface Query {
  [key: string]: QueryValues
}
```

Added in v0.4.0

# QueryValues (type alias)

**Signature**

```ts
export type QueryValues = string | Array<string> | undefined
```

Added in v0.4.0

# RowLacks (type alias)

Encodes the constraint that a given object `O`
does not contain specific keys `K`

**Signature**

```ts
export type RowLacks<O extends object, K extends string | number | symbol> = O & Record<Extract<keyof O, K>, never>
```

Added in v0.4.0

# Formatter (class)

**Signature**

```ts
export class Formatter<A> {
  constructor(readonly run: (r: Route, a: A) => Route) { ... }
  ...
}
```

Added in v0.4.0

## contramap (method)

**Signature**

```ts
contramap<B extends object>(f: (b: B) => A): Formatter<B> { ... }
```

Added in v0.4.0

## then (method)

**Signature**

```ts
then<B extends object>(that: Formatter<B> & Formatter<RowLacks<B, keyof A>>): Formatter<A & B> { ... }
```

Added in v0.4.0

# Match (class)

**Signature**

```ts
export class Match<A> {
  constructor(readonly parser: Parser<A>, readonly formatter: Formatter<A>) { ... }
  ...
}
```

Added in v0.4.0

## imap (method)

**Signature**

```ts
imap<B extends object>(f: (a: A) => B, g: (b: B) => A): Match<B> { ... }
```

Added in v0.4.0

## then (method)

**Signature**

```ts
then<B extends object>(that: Match<B> & Match<RowLacks<B, keyof A>>): Match<A & B> { ... }
```

Added in v0.4.0

# Parser (class)

**Signature**

```ts
export class Parser<A> {
  constructor(readonly run: (r: Route) => Option<[A, Route]>) { ... }
  ...
}
```

Added in v0.4.0

## of (static method)

**Signature**

```ts
static of<A extends object>(a: A): Parser<A> { ... }
```

Added in v0.4.0

## map (method)

**Signature**

```ts
map<B extends object>(f: (a: A) => B): Parser<B> { ... }
```

Added in v0.4.0

## ap (method)

**Signature**

```ts
ap<B extends object>(fab: Parser<(a: A) => B>): Parser<B> { ... }
```

Added in v0.4.0

## chain (method)

**Signature**

```ts
chain<B extends object>(f: (a: A) => Parser<B>): Parser<B> { ... }
```

Added in v0.4.0

## alt (method)

**Signature**

```ts
alt(that: Parser<A>): Parser<A> { ... }
```

Added in v0.4.0

## then (method)

A mapped Monoidal.mult

**Signature**

```ts
then<B extends object>(that: Parser<RowLacks<B, keyof A>>): Parser<A & B> { ... }
```

Added in v0.4.0

# Route (class)

**Signature**

```ts
export class Route {
  constructor(readonly parts: Array<string>, readonly query: Query) { ... }
  ...
}
```

Added in v0.4.0

## isEmpty (static method)

**Signature**

```ts
static isEmpty(r: Route): boolean { ... }
```

Added in v0.4.0

## parse (static method)

**Signature**

```ts
static parse(s: string, decode: boolean = true): Route { ... }
```

Added in v0.4.0

## toString (method)

**Signature**

```ts
toString(encode: boolean = true): string { ... }
```

Added in v0.4.0

# end (constant)

`end` matches the end of a route

**Signature**

```ts
export const end: Match<{}> = ...
```

Added in v0.4.0

# format (function)

**Signature**

```ts
export function format<A extends object>(formatter: Formatter<A>, a: A, encode: boolean = true): string { ... }
```

Added in v0.4.0

# getParserMonoid (function)

**Signature**

```ts
export const getParserMonoid = <A extends object>(): Monoid<Parser<A>> => ...
```

Added in v0.6.0

# getParserSemigroup (function)

**Signature**

```ts
export const getParserSemigroup = <A extends object>(): Semigroup<Parser<A>> => ({
  concat: (x, y) => ...
```

Added in v0.6.0

# int (function)

`int` matches any integer path component

**Signature**

```ts
export function int<K extends string>(k: K): Match<{ [_ in K]: number }> { ... }
```

**Example**

```ts
import { int, Route } from 'fp-ts-routing'
import { some, none } from 'fp-ts/lib/Option'

assert.deepStrictEqual(int('id').parser.run(Route.parse('/1')), some([{ id: 1 }, new Route([], {})]))
assert.deepStrictEqual(int('id').parser.run(Route.parse('/a')), none)
```

Added in v0.4.0

# lit (function)

`lit(x)` will match exactly the path component `x`

**Signature**

```ts
export function lit(literal: string): Match<{}> { ... }
```

**Example**

```ts
import { lit, Route } from 'fp-ts-routing'
import { some, none } from 'fp-ts/lib/Option'

assert.deepStrictEqual(lit('subview').parser.run(Route.parse('/subview/')), some([{}, new Route([], {})]))
assert.deepStrictEqual(lit('subview').parser.run(Route.parse('/')), none)
```

Added in v0.4.0

# parse (function)

**Signature**

```ts
export function parse<A extends object>(parser: Parser<A>, r: Route, a: A): A { ... }
```

Added in v0.4.0

# query (function)

Will match a querystring.

**Note**. Use `io-ts`'s `strict` instead of `type` otherwise excess properties won't be removed.

**Signature**

```ts
export function query<A extends object, T>(type: Type<A, Record<keyof T, QueryValues>>): Match<A> { ... }
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

# str (function)

`str` matches any string path component

**Signature**

```ts
export function str<K extends string>(k: K): Match<{ [_ in K]: string }> { ... }
```

**Example**

```ts
import { str, Route } from 'fp-ts-routing'
import { some, none } from 'fp-ts/lib/Option'

assert.deepStrictEqual(str('id').parser.run(Route.parse('/abc')), some([{ id: 'abc' }, new Route([], {})]))
assert.deepStrictEqual(str('id').parser.run(Route.parse('/')), none)
```

Added in v0.4.0

# succeed (function)

`succeed` matches everything but consumes nothing

**Signature**

```ts
export function succeed<A extends object>(a: A): Match<A> { ... }
```

Added in v0.4.0

# type (function)

`type` matches any io-ts type path component

**Signature**

```ts
export function type<K extends string, A>(k: K, type: Type<A, string>): Match<{ [_ in K]: A }> { ... }
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

# zero (function)

**Signature**

```ts
export function zero<A extends object>(): Parser<A> { ... }
```

Added in v0.4.0
