import * as assert from 'assert'
import * as t from 'io-ts'
import { DateFromISOString } from 'io-ts-types/lib/Date/DateFromISOString'
import { IntegerFromString } from 'io-ts-types/lib/number/IntegerFromString'
import { some } from '../node_modules/fp-ts/lib/Option'
import { end, int, lit, Match, parse, query, Route, str, type, zero } from '../src'

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
const invoice = _user
  .then(lit('invoice'))
  .then(int('invoiceId'))
  .then(end)

// router
const router = zero<Location>()
  .alt(defaults.parser.map(() => Home.value))
  .alt(home.parser.map(() => Home.value))
  .alt(user.parser.map(({ userId }) => new User(userId)))
  .alt(invoice.parser.map(({ userId, invoiceId }) => new Invoice(userId, invoiceId)))

// helpers
const parseLocation = (s: string): Location => parse(router, Route.parse(s), NotFound.value)
const formatLocation = <A extends object>(match: Match<A>) => (location: A): string =>
  match.formatter.run(Route.empty, location).toString()

describe('Route', () => {
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
      query: { a: '1' }
    })
    assert.deepEqual(Route.parse('/foo/bar/?a=1'), {
      parts: ['foo', 'bar'],
      query: { a: '1' }
    })
    assert.deepEqual(Route.parse('/a%20b'), {
      parts: ['a b'],
      query: {}
    })
    assert.deepEqual(Route.parse('/foo?a=b%20c'), {
      parts: ['foo'],
      query: { a: 'b c' }
    })
  })

  it('should format', () => {
    assert.strictEqual(new Route([], {}).toString(), '/')
    assert.strictEqual(new Route(['a'], {}).toString(), '/a')
    assert.strictEqual(new Route(['a'], { b: 'b' }).toString(), '/a?b=b')
    assert.strictEqual(new Route(['a'], { b: 'b c' }).toString(), '/a?b=b%20c')
    assert.strictEqual(new Route(['a c'], { b: 'b' }).toString(), '/a%20c?b=b')
  })

  it('parse and format should be inverse functions', () => {
    const path = '/a%20c?b=b%20c'
    assert.strictEqual(Route.parse(path).toString(), path)
  })
})

describe('parsers', () => {
  it('type', () => {
    const T = t.keyof({
      a: null,
      b: null,
      c: null
    })
    const match = lit('search')
      .then(type('topic', T))
      .then(end)
    assert.deepEqual(match.parser.run(Route.parse('/search/a')), some([{ topic: 'a' }, { parts: [], query: {} }]))
    assert.deepEqual(match.parser.run(Route.parse('/search/b')), some([{ topic: 'b' }, { parts: [], query: {} }]))
    assert.deepEqual(match.parser.run(Route.parse('/search/c')), some([{ topic: 'c' }, { parts: [], query: {} }]))
  })

  it('str', () => {
    assert.strictEqual(
      str('id')
        .parser.run(Route.parse('/astring'))
        .exists(([{ id }]) => id === 'astring'),
      true
    )
  })

  it('int', () => {
    assert.strictEqual(
      int('id')
        .parser.run(Route.parse('/1'))
        .exists(([{ id }]) => id === 1),
      true
    )
  })

  it('query', () => {
    assert.strictEqual(
      query(t.interface({ a: t.string, b: IntegerFromString }))
        .parser.run(Route.parse('/foo/bar/?a=baz&b=1'))
        .exists(([{ a, b }]) => a === 'baz' && b === 1),
      true
    )
    const date = '2018-01-18T14:51:47.912Z'
    assert.deepEqual(
      query(t.interface({ a: DateFromISOString })).formatter.run(Route.empty, { a: new Date(date) }),
      new Route([], { a: date })
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
