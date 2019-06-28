# Installation

To install the stable version:

```sh
npm i fp-ts-routing
```

# TypeScript compatibility

The stable version is tested against TypeScript 3.5.2 but should run with 3.2.2+ too.

# Usage

```ts
//
// locations
//

interface Home {
  readonly _tag: 'Home'
}

interface User {
  readonly _tag: 'User'
  readonly id: number
}

interface Invoice {
  readonly _tag: 'Invoice'
  readonly userId: number
  readonly invoiceId: number
}

interface NotFound {
  readonly _tag: 'NotFound'
}

type Location = Home | User | Invoice | NotFound

const home: Location = { _tag: 'Home' }

const user = (id: number): Location => ({ _tag: 'User', id })

const invoice = (userId: number, invoiceId: number): Location => ({ _tag: 'Invoice', userId, invoiceId })

const notFound: Location = { _tag: 'NotFound' }

// matches
const defaults = end
const homeMatch = lit('home').then(end)
const userIdMatch = lit('users').then(int('userId'))
const userMatch = userIdMatch.then(end)
const invoiceMatch = userIdMatch
  .then(lit('invoice'))
  .then(int('invoiceId'))
  .then(end)

// router
const router = zero<Location>()
  .alt(defaults.parser.map(() => home))
  .alt(homeMatch.parser.map(() => home))
  .alt(userMatch.parser.map(({ userId }) => user(userId)))
  .alt(invoiceMatch.parser.map(({ userId, invoiceId }) => invoice(userId, invoiceId)))

// helper
const parseLocation = (s: string): Location => parse(router, Route.parse(s), notFound)

import * as assert from 'assert'

//
// parsers
//

assert.strictEqual(parseLocation('/'), home)
assert.strictEqual(parseLocation('/home'), home)
assert.deepEqual(parseLocation('/users/1'), user(1))
assert.deepEqual(parseLocation('/users/1/invoice/2'), invoice(1, 2))
assert.strictEqual(parseLocation('/foo'), notFound)

//
// formatters
//

assert.strictEqual(format(userMatch.formatter, { userId: 1 }), '/users/1')
assert.strictEqual(format(invoiceMatch.formatter, { userId: 1, invoiceId: 2 }), '/users/1/invoice/2')
```

# Documentation

- [API Reference](https://gcanti.github.io/fp-ts-routing)
