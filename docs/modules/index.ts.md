---
title: index.ts
nav_order: 3
parent: Modules
---

## index overview

Added in v0.4.0

---

<h2 class="text-delta">Table of contents</h2>

- [formatters](#formatters)
  - [Formatter](#formatter)
  - [contramap](#contramap)
  - [format](#format)
  - [formatter](#formatter)
- [helpers](#helpers)
  - [RowLacks](#rowlacks)
- [matchers](#matchers)
  - [IntegerFromString](#integerfromstring)
  - [Match](#match)
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
  - [Parser](#parser)
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

---

# formatters

## Formatter

**Signature**

```ts
export declare const Formatter: typeof Formatter
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
export declare const format: <A>(formatter: Formatter<A>, a: A, encode?: boolean) => string
```

Added in v0.4.0

## formatter

**Signature**

```ts
export declare const formatter: Contravariant1<'fp-ts-routing/Formatter'>
```

Added in v0.5.1

# helpers

## RowLacks

**Signature**

```ts
export declare const RowLacks: any
```

Added in v0.4.0

# matchers

## IntegerFromString

**Signature**

```ts
export declare const IntegerFromString: Type<number, string, unknown>
```

Added in v0.4.2

## Match

**Signature**

```ts
export declare const Match: typeof Match
```

Added in v0.4.0

## end

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

**Signature**

```ts
export declare const int: <K extends string>(k: K) => Match<{ [_ in K]: number }>
```

Added in v0.4.0

## lit

**Signature**

```ts
export declare const lit: (literal: string) => Match<{}>
```

Added in v0.4.0

## query

**Signature**

```ts
export declare const query: <A>(type: Type<A, Record<string, QueryValues>, unknown>) => Match<A>
```

Added in v0.4.0

## str

**Signature**

```ts
export declare const str: <K extends string>(k: K) => Match<{ [_ in K]: string }>
```

Added in v0.4.0

## succeed

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

**Signature**

```ts
export declare const type: <K extends string, A>(k: K, type: Type<A, string, unknown>) => Match<{ [_ in K]: A }>
```

Added in v0.4.0

# parsers

## Parser

**Signature**

```ts
export declare const Parser: typeof Parser
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
export declare const parse: <A>(parser: Parser<A>, r: Route, a: A) => A
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
export declare const zero: <A>() => Parser<A>
```

Added in v0.4.0
