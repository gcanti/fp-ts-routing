---
title: parser.ts
nav_order: 5
parent: Modules
---

## parser overview

Added in v0.6.0

---

<h2 class="text-delta">Table of contents</h2>

- [parsers](#parsers)
  - [Parser (class)](#parser-class)
    - [of (static method)](#of-static-method)
    - [map (method)](#map-method)
    - [ap (method)](#ap-method)
    - [chain (method)](#chain-method)
    - [alt (method)](#alt-method)
    - [then (method)](#then-method)
    - [\_A (property)](#_a-property)
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

# parsers

## Parser (class)

**Signature**

```ts
export declare class Parser<A> {
  constructor(readonly run: (r: Route) => O.Option<[A, Route]>)
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
