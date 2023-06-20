---
title: route.ts
nav_order: 6
parent: Modules
---

## route overview

Added in v0.6.0

---

<h2 class="text-delta">Table of contents</h2>

- [routes](#routes)
  - [Query (interface)](#query-interface)
  - [QueryValues (type alias)](#queryvalues-type-alias)
  - [Route (class)](#route-class)
    - [isEmpty (static method)](#isempty-static-method)
    - [parse (static method)](#parse-static-method)
    - [toString (method)](#tostring-method)

---

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
