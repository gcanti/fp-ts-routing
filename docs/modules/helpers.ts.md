---
title: helpers.ts
nav_order: 1
parent: Modules
---

## helpers overview

Added in v0.6.0

---

<h2 class="text-delta">Table of contents</h2>

- [helpers](#helpers)
  - [RowLacks (type alias)](#rowlacks-type-alias)

---

# helpers

## RowLacks (type alias)

Encodes the constraint that a given object `O`
does not contain specific keys `K`

**Signature**

```ts
export type RowLacks<O, K extends string | number | symbol> = O & Record<Extract<keyof O, K>, never>
```

Added in v0.4.0
