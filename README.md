# TypeScript compatibility

The stable version is tested against TypeScript 3.1.6

# Usage

```ts
import { lit, int, end, zero, Route, parse, format } from 'fp-ts-routing'

//
// locations
//

class Home {
  static value = new Home()
  readonly _tag: 'Home' = 'Home'
  private constructor() {}
}

class User {
  readonly _tag: 'User' = 'User'
  constructor(readonly id: number) {}
}

class Invoice {
  readonly _tag: 'Invoice' = 'Invoice'
  constructor(readonly userId: number, readonly invoiceId: number) {}
}

class NotFound {
  static value = new NotFound()
  readonly _tag: 'NotFound' = 'NotFound'
  private constructor() {}
}

type Location = Home | User | Invoice | NotFound

// matches
const defaults = end
const home = lit('home').then(end)
const userId = lit('users').then(int('userId'))
const user = userId.then(end)
const invoice = userId
  .then(lit('invoice'))
  .then(int('invoiceId'))
  .then(end)

// router
const router = zero<Location>()
  .alt(defaults.parser.map(() => Home.value))
  .alt(home.parser.map(() => Home.value))
  .alt(user.parser.map(({ userId }) => new User(userId)))
  .alt(invoice.parser.map(({ userId, invoiceId }) => new Invoice(userId, invoiceId)))

// helper
const parseLocation = (s: string): Location => parse(router, Route.parse(s), NotFound.value)

import * as assert from 'assert'

//
// parsers
//

assert.strictEqual(parseLocation('/'), Home.value)
assert.strictEqual(parseLocation('/home'), Home.value)
assert.deepEqual(parseLocation('/users/1'), new User(1))
assert.deepEqual(parseLocation('/users/1/invoice/2'), new Invoice(1, 2))
assert.strictEqual(parseLocation('/foo'), NotFound.value)

//
// formatters
//

assert.strictEqual(format(user.formatter, { userId: 1 }), '/users/1')
assert.strictEqual(format(invoice.formatter, { userId: 1, invoiceId: 2 }), '/users/1/invoice/2')
```

# Defining new matches via `io-ts` types

The function `type` allows to define a new `Match` from a [io-ts](https://github.com/gcanti/io-ts) runtime type

```ts
type<K extends string, A>(k: K, type: t.Type<A>): Match<{ [_ in K]: A }>
```
