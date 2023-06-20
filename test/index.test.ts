import * as assert from 'assert'

import { end, format, int, lit, parse, Route, zero } from '../src'

describe('Usage example', () => {
  // locations
  interface Home {
    readonly _tag: 'Home'
  }

  const Home = (): Home => ({ _tag: 'Home' })

  interface User {
    readonly _tag: 'User'
    readonly id: number
  }

  const User = (id: number): User => ({ _tag: 'User', id })

  interface Invoice {
    readonly _tag: 'Invoice'
    readonly userId: number
    readonly invoiceId: number
  }

  const Invoice = (userId: number, invoiceId: number): Invoice => ({ _tag: 'Invoice', userId, invoiceId })

  interface NotFound {
    readonly _tag: 'NotFound'
  }

  const NotFound = (): NotFound => ({ _tag: 'NotFound' })

  type Location = Home | User | Invoice | NotFound

  // matches
  const defaults = end
  const home = lit('home').then(end)
  const userId = lit('users').then(int('userId'))
  const user = userId.then(end)
  const invoice = userId.then(lit('invoice')).then(int('invoiceId')).then(end)

  // router
  const router = zero<Location>()
    .alt(defaults.parser.map(() => Home()))
    .alt(home.parser.map(() => Home()))
    .alt(user.parser.map(({ userId }) => User(userId)))
    .alt(invoice.parser.map(({ userId, invoiceId }) => Invoice(userId, invoiceId)))

  // helpers
  const parseLocation = (s: string): Location => parse(router, Route.parse(s), NotFound())

  it('should match a location', () => {
    assert.deepStrictEqual(parseLocation('/'), Home())
    assert.deepStrictEqual(parseLocation('/home'), Home())
    assert.deepStrictEqual(parseLocation('/users/1'), User(1))
    assert.deepStrictEqual(parseLocation('/users/1/invoice/2'), Invoice(1, 2))
    assert.deepStrictEqual(parseLocation('/foo'), NotFound())
  })

  it('should format a location', () => {
    assert.strictEqual(format(user.formatter, { userId: 1 }), '/users/1')
    assert.strictEqual(format(invoice.formatter, { userId: 1, invoiceId: 2 }), '/users/1/invoice/2')
  })
})
