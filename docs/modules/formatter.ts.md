---
title: formatter.ts
nav_order: 1
parent: Modules
---

## formatter overview

Added in v0.6.0

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
  - [then](#then)

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
export declare const format: <A>(formatter: Formatter<A>, a: A, encode?: boolean) => string
```

Added in v0.4.0

## formatter

**Signature**

```ts
export declare const formatter: Contravariant1<'fp-ts-routing/Formatter'>
```

Added in v0.5.1

## then

**Signature**

```ts
export declare const then: <B>(
  fb: Formatter<B>
) => <A>(fa: Formatter<A> & Formatter<RowLacks<A, keyof B>>) => Formatter<A & B>
```

Added in v0.6.0
