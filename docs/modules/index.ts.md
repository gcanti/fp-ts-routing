---
title: index.ts
nav_order: 1
parent: Modules
---

## index overview

Added in v0.4.0

---

<h2 class="text-delta">Table of contents</h2>

- [formatters](#formatters)
  - [Formatter (class)](#formatter-class)
    - [contramap (method)](#contramap-method)
    - [then (method)](#then-method)
    - [\_A (property)](#_a-property)
  - [contramap](#contramap)
  - [format](#format)
  - [formatter](#formatter)
- [matchers](#matchers)
  - [Match (class)](#match-class)
    - [imap (method)](#imap-method)
    - [then (method)](#then-method-1)
    - [\_A (property)](#_a-property-1)
  - [end](#end)
  - [imap](#imap)
  - [int](#int)
  - [lit](#lit)
  - [query](#query)
  - [str](#str)
  - [succeed](#succeed)
  - [then](#then)
  - [type](#type)
- [parsers](#parsers)
  - [Parser (class)](#parser-class)
    - [of (static method)](#of-static-method)
    - [map (method)](#map-method)
    - [ap (method)](#ap-method)
    - [chain (method)](#chain-method)
    - [alt (method)](#alt-method)
    - [then (method)](#then-method-2)
    - [\_A (property)](#_a-property-2)
  - [alt](#alt)
  - [ap](#ap)
  - [apFirst](#apfirst)
  - [apSecond](#apsecond)
  - [chain](#chain)
  - [chainFirst](#chainfirst)
  - [flatten](#flatten)
  - [getParserMonoid](#getparsermonoid)
  - [map](#map)
  - [parse](#parse)
  - [parser](#parser)
  - [zero](#zero)
- [routes](#routes)
  - [Query (interface)](#query-interface)
  - [QueryValues (type alias)](#queryvalues-type-alias)
  - [Route (class)](#route-class)
    - [isEmpty (static method)](#isempty-static-method)
    - [parse (static method)](#parse-static-method)
    - [toString (method)](#tostring-method)
- [utils](#utils)
  - [RowLacks (type alias)](#rowlacks-type-alias)

---

# formatters

## Formatter (class)

**Signature**

```ts
export declare class Formatter<A> {
  constructor(readonly run: (r: Route, a: A) => Route)
}
```

Added in v0.4.0

### contramap (method)

**Signature**

```ts
contramap<B>(f: (b: B) => A): Formatter<B>
```

Added in v0.4.0

### then (method)

**Signature**

```ts
then<B>(that: Formatter<B> & Formatter<RowLacks<B, keyof A>>): Formatter<A & B>
```

Added in v0.4.0

### \_A (property)

**Signature**

```ts
readonly _A: A
```

Added in v0.4.0

## contramap

**Signature**

```ts
export declare const contramap: <A, B>(f: (b: B) => A) => (fa: Formatter<A>) => Formatter<B>
```

Added in v0.5.1

## format

**Signature**

```ts
export declare function format<A>(formatter: Formatter<A>, a: A, encode: boolean = true): string
```

Added in v0.4.0

## formatter

**Signature**

```ts
export declare const formatter: Contravariant1<'fp-ts-routing/Formatter'>
```

Added in v0.5.1

# matchers

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
export declare function imap<A, B>(f: (a: A) => B, g: (b: B) => A): (ma: Match<A>) => Match<B>
```

Added in v0.5.1

## int

`int` matches any integer path component

**Signature**

```ts
export declare function int<K extends string>(k: K): Match<{ [_ in K]: number }>
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
export declare function lit(literal: string): Match<{}>
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
export declare function query<A>(type: Type<A, Record<string, QueryValues>>): Match<A>
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
export declare function str<K extends string>(k: K): Match<{ [_ in K]: string }>
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
export declare function succeed<A>(a: A): Match<A>
```

Added in v0.4.0

## then

**Signature**

```ts
export declare function then<B>(mb: Match<B>): <A>(ma: Match<A> & Match<RowLacks<A, keyof B>>) => Match<A & B>
```

Added in v0.5.1

## type

`type` matches any io-ts type path component

**Signature**

```ts
export declare function type<K extends string, A>(k: K, type: Type<A, string>): Match<{ [_ in K]: A }>
```

**Example**

```ts
import * as t from 'io-ts'
import { lit, type, Route } from 'fp-ts-routing'
import { some, none } from 'fp-ts/lib/Option'

const T = t.keyof({
  a: null,
  b: null,
})

const match = lit('search').then(type('topic', T))

assert.deepStrictEqual(match.parser.run(Route.parse('/search/a')), some([{ topic: 'a' }, Route.empty]))
assert.deepStrictEqual(match.parser.run(Route.parse('/search/b')), some([{ topic: 'b' }, Route.empty]))
assert.deepStrictEqual(match.parser.run(Route.parse('/search/')), none)
```

Added in v0.4.0

# parsers

## Parser (class)

**Signature**

```ts
export declare class Parser<A> {
  constructor(readonly run: (r: Route) => Option<[A, Route]>)
}
```

Added in v0.4.0

### of (static method)

**Signature**

```ts
static of<A>(a: A): Parser<A>
```

Added in v0.4.0

### map (method)

**Signature**

```ts
map<B>(f: (a: A) => B): Parser<B>
```

Added in v0.4.0

### ap (method)

**Signature**

```ts
ap<B>(fab: Parser<(a: A) => B>): Parser<B>
```

Added in v0.4.0

### chain (method)

**Signature**

```ts
chain<B>(f: (a: A) => Parser<B>): Parser<B>
```

Added in v0.4.0

### alt (method)

**Signature**

```ts
alt(that: Parser<A>): Parser<A>
```

Added in v0.4.0

### then (method)

**Signature**

```ts
then<B>(that: Parser<RowLacks<B, keyof A>>): Parser<A & B>
```

Added in v0.4.0

### \_A (property)

**Signature**

```ts
readonly _A: A
```

Added in v0.4.0

## alt

**Signature**

```ts
export declare const alt: <A>(that: Lazy<Parser<A>>) => (fa: Parser<A>) => Parser<A>
```

Added in v0.5.1

## ap

**Signature**

```ts
export declare const ap: <A>(fa: Parser<A>) => <B>(fab: Parser<(a: A) => B>) => Parser<B>
```

Added in v0.5.1

## apFirst

**Signature**

```ts
export declare const apFirst: <B>(fb: Parser<B>) => <A>(fa: Parser<A>) => Parser<A>
```

Added in v0.5.1

## apSecond

**Signature**

```ts
export declare const apSecond: <B>(fb: Parser<B>) => <A>(fa: Parser<A>) => Parser<B>
```

Added in v0.5.1

## chain

**Signature**

```ts
export declare const chain: <A, B>(f: (a: A) => Parser<B>) => (ma: Parser<A>) => Parser<B>
```

Added in v0.5.1

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, B>(f: (a: A) => Parser<B>) => (ma: Parser<A>) => Parser<A>
```

Added in v0.5.1

## flatten

**Signature**

```ts
export declare const flatten: <A>(mma: Parser<Parser<A>>) => Parser<A>
```

Added in v0.5.1

## getParserMonoid

**Signature**

```ts
export declare const getParserMonoid: <A>() => Monoid<Parser<A>>
```

Added in v0.5.1

## map

**Signature**

```ts
export declare const map: <A, B>(f: (a: A) => B) => (fa: Parser<A>) => Parser<B>
```

Added in v0.5.1

## parse

**Signature**

```ts
export declare function parse<A>(parser: Parser<A>, r: Route, a: A): A
```

Added in v0.4.0

## parser

**Signature**

```ts
export declare const parser: Monad1<'fp-ts-routing/Parser'> & Alternative1<'fp-ts-routing/Parser'>
```

Added in v0.5.1

## zero

**Signature**

```ts
export declare function zero<A>(): Parser<A>
```

Added in v0.4.0

# routes

## Query (interface)

**Signature**

```ts
export interface Query {
  [key: string]: QueryValues
}
```

Added in v0.4.0

## QueryValues (type alias)

**Signature**

```ts
export type QueryValues = string | Array<string> | undefined
```

Added in v0.4.0

## Route (class)

**Signature**

```ts
export declare class Route {
  constructor(readonly parts: Array<string>, readonly query: Query)
}
```

Added in v0.4.0

### isEmpty (static method)

**Signature**

```ts
static isEmpty(r: Route): boolean
```

Added in v0.4.0

### parse (static method)

**Signature**

```ts
static parse(s: string, decode: boolean = true): Route
```

Added in v0.4.0

### toString (method)

**Signature**

```ts
toString(encode: boolean = true): string
```

Added in v0.4.0

# utils

## RowLacks (type alias)

Encodes the constraint that a given object `O`
does not contain specific keys `K`

**Signature**

```ts
export type RowLacks<O, K extends string | number | symbol> = O & Record<Extract<keyof O, K>, never>
```

Added in v0.4.0
