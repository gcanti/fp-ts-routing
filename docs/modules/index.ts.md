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
  - [map (method)](#map-method)
  - [ap (method)](#ap-method)
  - [chain (method)](#chain-method)
  - [alt (method)](#alt-method)
  - [then (method)](#then-method-2)
- [Route (class)](#route-class)
  - [toString (method)](#tostring-method)
- [end (constant)](#end-constant)
- [format (function)](#format-function)
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

# QueryValues (type alias)

**Signature**

```ts
export type QueryValues = string | Array<string> | undefined
```

# RowLacks (type alias)

Encodes the constraint that a given object `O`
does not contain specific keys `K`

**Signature**

```ts
export type RowLacks<O extends object, K extends string | number | symbol> = O & Record<Extract<keyof O, K>, never>
```

# Formatter (class)

**Signature**

```ts
export class Formatter<A> {
  constructor(readonly run: (r: Route, a: A) => Route) { ... }
  ...
}
```

## contramap (method)

**Signature**

```ts
contramap<B extends object>(f: (b: B) => A): Formatter<B> { ... }
```

## then (method)

**Signature**

```ts
then<B extends object>(that: Formatter<B> & Formatter<RowLacks<B, keyof A>>): Formatter<A & B> { ... }
```

# Match (class)

**Signature**

```ts
export class Match<A> {
  constructor(readonly parser: Parser<A>, readonly formatter: Formatter<A>) { ... }
  ...
}
```

## imap (method)

**Signature**

```ts
imap<B extends object>(f: (a: A) => B, g: (b: B) => A): Match<B> { ... }
```

## then (method)

**Signature**

```ts
then<B extends object>(that: Match<B> & Match<RowLacks<B, keyof A>>): Match<A & B> { ... }
```

# Parser (class)

**Signature**

```ts
export class Parser<A> {
  constructor(readonly run: (r: Route) => Option<[A, Route]>) { ... }
  ...
}
```

## map (method)

**Signature**

```ts
map<B extends object>(f: (a: A) => B): Parser<B> { ... }
```

## ap (method)

**Signature**

```ts
ap<B extends object>(fab: Parser<(a: A) => B>): Parser<B> { ... }
```

## chain (method)

**Signature**

```ts
chain<B extends object>(f: (a: A) => Parser<B>): Parser<B> { ... }
```

## alt (method)

**Signature**

```ts
alt(that: Parser<A>): Parser<A> { ... }
```

## then (method)

A mapped Monoidal.mult

**Signature**

```ts
then<B extends object>(that: Parser<RowLacks<B, keyof A>>): Parser<A & B> { ... }
```

# Route (class)

**Signature**

```ts
export class Route {
  constructor(readonly parts: Array<string>, readonly query: Query) { ... }
  ...
}
```

## toString (method)

**Signature**

```ts
toString(encode: boolean = true): string { ... }
```

# end (constant)

`end` matches the end of a route

**Signature**

```ts
export const end: Match<{}> = ...
```

# format (function)

**Signature**

```ts
export const format = <A extends object>(formatter: Formatter<A>, a: A, encode: boolean = true): string => ...
```

# int (function)

`int` matches any integer path component

**Signature**

```ts
export const int = <K extends string>(k: K): Match<{ [_ in K]: number }> => ...
```

# lit (function)

`lit(x)` will match exactly the path component `x`
For example, `lit('x')` matches `/x`

**Signature**

```ts
export const lit = (literal: string): Match<{}> =>
  new Match(
    new Parser(r =>
      fold(r.parts, none, (head, tail) => (head === literal ? some(tuple({}, new Route(tail, r.query))) : none))
    ),
    new Formatter((r, n) => ...
```

# parse (function)

**Signature**

```ts
export const parse = <A extends object>(parser: Parser<A>, r: Route, a: A): A =>
  parser
    .run(r)
    .map(([a]) => ...
```

# query (function)

**Signature**

```ts
export const query = <A extends object, T>(type: Type<A, Record<keyof T, QueryValues>>): Match<A> =>
  new Match(
    new Parser(r => fromEither(type.decode(r.query)).map(query => tuple(query, new Route(r.parts, {})))),
    new Formatter((r, query) => ...
```

# str (function)

`str` matches any string path component

**Signature**

```ts
export const str = <K extends string>(k: K): Match<{ [_ in K]: string }> => ...
```

# succeed (function)

`succeed` matches everything but consumes nothing

**Signature**

```ts
export const succeed = <A extends object>(a: A): Match<A> =>
  new Match(new Parser(r => ...
```

# type (function)

`type` matches any io-ts type path component

**Signature**

```ts
export const type = <K extends string, A>(k: K, type: Type<A, string>): Match<{ [_ in K]: A }> =>
  new Match(
    new Parser(r =>
      fold(r.parts, none, (head, tail) =>
        fromEither(type.decode(head)).map(a => tuple(singleton(k, a), new Route(tail, r.query)))
      )
    ),
    new Formatter((r, o) => ...
```

# zero (function)

**Signature**

```ts
export const zero = <A extends object>(): Parser<A> => new Parser(() => ...
```
