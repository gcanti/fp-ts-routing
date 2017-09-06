# Usage

```ts
import { lit, int, end, zero, Route, parse, Match } from 'fp-ts-routing'

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

//
// matches
//

const defaults = end
const home = lit('home').then(end)
const _user = lit('users').then(int('userId'))
const user = _user.then(end)
const invoice = _user.then(lit('invoice')).then(int('invoiceId')).then(end)

//
// router
//

const router = zero<Location>()
  .alt(defaults.parser.map(() => Home.value))
  .alt(home.parser.map(() => Home.value))
  .alt(user.parser.map(({ userId }) => new User(userId)))
  .alt(invoice.parser.map(({ userId, invoiceId }) => new Invoice(userId, invoiceId)))

//
// helpers
//

const parseLocation = (s: string): Location => parse(router, Route.parse(s), NotFound.value)
const formatLocation = <A>(match: Match<A>) => (location: A): string =>
  match.formatter.run(Route.empty, location).toString()

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

assert.strictEqual(formatLocation(user)({ userId: 1 }), '/users/1')
assert.strictEqual(formatLocation(invoice)({ userId: 1, invoiceId: 2 }), '/users/1/invoice/2')
```
