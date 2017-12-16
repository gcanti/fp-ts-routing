import * as assert from 'assert'
import { lit, int, end, zero, parse, Route, Match, str, query } from '../src'
import { IntegerFromString } from 'io-ts-types/lib/number/IntegerFromString'
import * as t from 'io-ts'

//
// usage
//

// locations
class Home {
  static value = new Home()
  readonly _tag: 'Home' = 'Home'
  private constructor() {}
  inspect(): string {
    return this.toString()
  }
  toString(): string {
    return `Home.value`
  }
}

class User {
  readonly _tag: 'User' = 'User'
  constructor(readonly id: number) {}
  inspect(): string {
    return this.toString()
  }
  toString(): string {
    return `new User(${this.id})`
  }
}

class Invoice {
  readonly _tag: 'Invoice' = 'Invoice'
  constructor(readonly userId: number, readonly invoiceId: number) {}
  inspect(): string {
    return this.toString()
  }
  toString(): string {
    return `new Invoice(${this.userId}, ${this.invoiceId})`
  }
}

class NotFound {
  static value = new NotFound()
  readonly _tag: 'NotFound' = 'NotFound'
  private constructor() {}
  inspect(): string {
    return this.toString()
  }
  toString(): string {
    return `NotFound.value`
  }
}

type Location = Home | User | Invoice | NotFound

// matches
const defaults = end
const home = lit('home').then(end)
const _user = lit('users').then(int('userId'))
const user = _user.then(end)
const invoice = _user.then(lit('invoice')).then(int('invoiceId')).then(end)

// router
const router = zero<Location>()
  .alt(defaults.parser.map(() => Home.value))
  .alt(home.parser.map(() => Home.value))
  .alt(user.parser.map(({ userId }) => new User(userId)))
  .alt(invoice.parser.map(({ userId, invoiceId }) => new Invoice(userId, invoiceId)))

// helpers
const parseLocation = (s: string): Location => parse(router, Route.parse(s), NotFound.value)
const formatLocation = <A>(match: Match<A>) => (location: A): string =>
  match.formatter.run(Route.empty, location).toString()

describe('Route.parse', () => {
  it('should parse a path', () => {
    assert.deepEqual(Route.parse('/'), {
      parts: [],
      query: {}
    })
    assert.deepEqual(Route.parse('/foo'), {
      parts: ['foo'],
      query: {}
    })
    assert.deepEqual(Route.parse('/foo/bar'), {
      parts: ['foo', 'bar'],
      query: {}
    })
    assert.deepEqual(Route.parse('/foo/bar/'), {
      parts: ['foo', 'bar'],
      query: {}
    })
    assert.deepEqual(Route.parse('/foo/bar?a=1'), {
      parts: ['foo', 'bar'],
      query: { a: 1 }
    })
    assert.deepEqual(Route.parse('/foo/bar/?a=1'), {
      parts: ['foo', 'bar'],
      query: { a: 1 }
    })
  })
})

describe('parsers', () => {
  it('str', () => {
    assert.strictEqual(str('id').parser.run(Route.parse('/astring')).exists(([{ id }]) => id === 'astring'), true)
  })

  it('int', () => {
    assert.strictEqual(int('id').parser.run(Route.parse('/1')).exists(([{ id }]) => id === 1), true)
  })

  it('query', () => {
    assert.strictEqual(
      query(t.interface({ a: t.string, b: IntegerFromString })).parser
        .run(Route.parse('/foo/bar/?a=baz&b=1'))
        .exists(([{ a, b }]) => a === 'baz' && b === 1),
      true
    )
  })

  it('should match a location', () => {
    assert.strictEqual(parseLocation('/'), Home.value)
    assert.strictEqual(parseLocation('/home'), Home.value)
    assert.deepEqual(parseLocation('/users/1'), new User(1))
    assert.deepEqual(parseLocation('/users/1/invoice/2'), new Invoice(1, 2))
    assert.strictEqual(parseLocation('/foo'), NotFound.value)
  })
})

describe('format', () => {
  it('should format a location', () => {
    assert.strictEqual(formatLocation(user)({ userId: 1 }), '/users/1')
    assert.strictEqual(formatLocation(invoice)({ userId: 1, invoiceId: 2 }), '/users/1/invoice/2')
  })
})
