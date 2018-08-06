import * as assert from 'assert'
import * as t from 'io-ts'
import { DateFromISOString } from 'io-ts-types/lib/Date/DateFromISOString'
import { IntegerFromString } from 'io-ts-types/lib/number/IntegerFromString'
import { some, none } from 'fp-ts/lib/Option'
import { end, format, int, lit, parse, query, Route, str, type, zero, Formatter, succeed } from '../src'

describe('Route', () => {
  it('parse', () => {
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
    assert.deepEqual(Route.parse('/@a'), {
      parts: ['@a'],
      query: {}
    })
    assert.deepEqual(Route.parse('/%40a'), {
      parts: ['@a'],
      query: {}
    })
    assert.deepEqual(Route.parse('/?a=@b'), {
      parts: [],
      query: { a: '@b' }
    })
    assert.deepEqual(Route.parse('/?@a=b'), {
      parts: [],
      query: { '@a': 'b' }
    })
  })

  it('parse (decode = false)', () => {
    assert.deepEqual(Route.parse('/%40a', false), {
      parts: ['%40a'],
      query: {}
    })
  })

  it('toString', () => {
    assert.strictEqual(new Route([], {}).toString(), '/')
    assert.strictEqual(new Route(['a'], {}).toString(), '/a')
    assert.strictEqual(new Route(['a'], { b: 'b' }).toString(), '/a?b=b')
    assert.strictEqual(new Route(['a'], { b: 'b c' }).toString(), '/a?b=b%20c')
    assert.strictEqual(new Route(['a c'], { b: 'b' }).toString(), '/a%20c?b=b')
    assert.strictEqual(new Route(['@a'], {}).toString(), '/%40a')
    assert.strictEqual(new Route(['a&b'], {}).toString(), '/a%26b')
    assert.strictEqual(new Route([], { a: '@b' }).toString(), '/?a=%40b')
    assert.strictEqual(new Route([], { '@a': 'b' }).toString(), '/?%40a=b')
  })

  it('toString (encode = false)', () => {
    assert.strictEqual(new Route(['@a'], {}).toString(false), '/@a')
  })

  it('parse and toString should be inverse functions', () => {
    const path = '/a%20c?b=b%20c'
    assert.strictEqual(Route.parse(path).toString(), path)
  })

  it('isEmpty', () => {
    assert.strictEqual(Route.isEmpty(new Route([], {})), true)
    assert.strictEqual(Route.isEmpty(new Route(['a'], {})), false)
    assert.strictEqual(Route.isEmpty(new Route([], { a: 'a' })), false)
  })
})

describe('format', () => {
  it('encode = false', () => {
    const x = str('username')
    assert.strictEqual(format(x.formatter, { username: '@giulio' }, false), '/@giulio')
  })
})

describe('Formatter', () => {
  it('contramap', () => {
    const x = new Formatter((r, a: { foo: number }) => new Route(r.parts.concat(String(a.foo)), r.query))
    const y = x.contramap((b: { bar: string }) => ({ foo: b.bar.length }))
    assert.strictEqual(format(y, { bar: 'baz' }), '/3')
  })
})

describe('Match', () => {
  it('imap', () => {
    const x = str('id')
    const y = x.imap(({ id }) => ({ userId: id }), ({ userId }) => ({ id: userId }))
    assert.deepEqual(parse(y.parser, Route.parse('/1'), { userId: '0' }), {
      userId: '1'
    })
    assert.strictEqual(format(y.formatter, { userId: '1' }), '/1')
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
    assert.deepEqual(int('id').parser.run(Route.parse('/1a')), none)
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
      query(t.interface({ a: DateFromISOString })).formatter.run(Route.empty, {
        a: new Date(date)
      }),
      new Route([], { a: date })
    )
  })

  it('succeed', () => {
    assert.deepEqual(succeed({}).parser.run(Route.parse('/')), some([{}, { parts: [], query: {} }]))
    assert.deepEqual(succeed({}).parser.run(Route.parse('/a')), some([{}, { parts: ['a'], query: {} }]))
    assert.deepEqual(
      succeed({ meaning: 42 }).parser.run(Route.parse('/a')),
      some([{ meaning: 42 }, { parts: ['a'], query: {} }])
    )
  })

  it('end', () => {
    const match = end
    assert.deepEqual(match.parser.run(Route.parse('/')), some([{}, { parts: [], query: {} }]))
    assert.deepEqual(match.parser.run(Route.parse('/a')), none)
  })

  it('lit', () => {
    const match = lit('subview')
    assert.deepEqual(match.parser.run(Route.parse('/subview/')), some([{}, { parts: [], query: {} }]))
  })
})

describe('Usage example', () => {
  // locations
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

  // helpers
  const parseLocation = (s: string): Location => parse(router, Route.parse(s), NotFound.value)

  it('should match a location', () => {
    assert.strictEqual(parseLocation('/'), Home.value)
    assert.strictEqual(parseLocation('/home'), Home.value)
    assert.deepEqual(parseLocation('/users/1'), new User(1))
    assert.deepEqual(parseLocation('/users/1/invoice/2'), new Invoice(1, 2))
    assert.strictEqual(parseLocation('/foo'), NotFound.value)
  })

  it('should format a location', () => {
    assert.strictEqual(format(user.formatter, { userId: 1 }), '/users/1')
    assert.strictEqual(format(invoice.formatter, { userId: 1, invoiceId: 2 }), '/users/1/invoice/2')
  })
})
