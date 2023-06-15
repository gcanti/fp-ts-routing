import * as assert from 'assert'
import * as t from 'io-ts'
import { some, none, exists, isSome } from 'fp-ts/lib/Option'
import {
  end,
  format,
  int,
  lit,
  parse,
  query,
  Route,
  str,
  type,
  zero,
  Formatter,
  succeed,
  IntegerFromString,
  getParserMonoid,
  parser,
  formatter,
  imap,
  then
} from '../src'
import * as Arr from 'fp-ts/lib/Array'
import * as E from 'fp-ts/lib/Either'
import * as S from 'fp-ts/lib/string'
import { pipe } from 'fp-ts/lib/function'

const arrEquals = Arr.getEq(S.Eq)

describe('IntegerFromString', () => {
  it('is', () => {
    assert.strictEqual(IntegerFromString.is('a'), false)
    assert.strictEqual(IntegerFromString.is(1.2), false)
    assert.strictEqual(IntegerFromString.is(1), true)
  })
})

describe('Route', () => {
  it('parse', () => {
    assert.deepStrictEqual(Route.parse(''), Route.empty)
    assert.deepStrictEqual(Route.parse('/'), Route.empty)
    assert.deepStrictEqual(Route.parse('/foo'), new Route(['foo'], {}))
    assert.deepStrictEqual(Route.parse('/foo/bar'), new Route(['foo', 'bar'], {}))
    assert.deepStrictEqual(Route.parse('/foo/bar/'), new Route(['foo', 'bar'], {}))
    assert.deepStrictEqual(Route.parse('/foo/bar?a=1'), new Route(['foo', 'bar'], { a: '1' }))
    assert.deepStrictEqual(Route.parse('/foo/bar/?a=1'), new Route(['foo', 'bar'], { a: '1' }))
    assert.deepStrictEqual(Route.parse('/foo/bar?a=1&a=2&a=3'), new Route(['foo', 'bar'], { a: ['1', '2', '3'] }))
    assert.deepStrictEqual(Route.parse('/a%20b'), new Route(['a b'], {}))
    assert.deepStrictEqual(Route.parse('/foo?a=b%20c'), new Route(['foo'], { a: 'b c' }))
    assert.deepStrictEqual(Route.parse('/@a'), new Route(['@a'], {}))
    assert.deepStrictEqual(Route.parse('/%40a'), new Route(['@a'], {}))
    assert.deepStrictEqual(Route.parse('/?a=@b'), new Route([], { a: '@b' }))
    assert.deepStrictEqual(Route.parse('/?@a=b'), new Route([], { '@a': 'b' }))
  })

  it('parse (decode = false)', () => {
    assert.deepStrictEqual(Route.parse('/%40a', false), new Route(['%40a'], {}))
  })

  it('toString', () => {
    assert.strictEqual(new Route([], {}).toString(), '/')
    assert.strictEqual(new Route(['a'], {}).toString(), '/a')
    assert.strictEqual(new Route(['a'], { b: 'b' }).toString(), '/a?b=b')
    assert.strictEqual(new Route(['a'], { b: 'b c' }).toString(), '/a?b=b+c')
    assert.strictEqual(new Route(['a'], { b: ['1', '2', '3'] }).toString(), '/a?b=1&b=2&b=3')
    assert.strictEqual(new Route(['a'], { b: undefined }).toString(), '/a')
    assert.strictEqual(new Route(['a c'], { b: 'b' }).toString(), '/a%20c?b=b')
    assert.strictEqual(new Route(['@a'], {}).toString(), '/%40a')
    assert.strictEqual(new Route(['a&b'], {}).toString(), '/a%26b')
    assert.strictEqual(new Route([], { a: '@b' }).toString(), '/?a=%40b')
    assert.strictEqual(new Route([], { '@a': 'b' }).toString(), '/?%40a=b')
  })

  it('toString (encode = false)', () => {
    assert.strictEqual(new Route(['@a'], {}).toString(false), '/@a')
  })

  it('toString discards undefined parameters', () => {
    const stringOrUndefined = t.union([t.undefined, t.string])
    const dummy = lit('x').then(query(t.interface({ a: stringOrUndefined, b: stringOrUndefined })))
    assert.deepStrictEqual(
      dummy.parser.run(Route.parse(format(dummy.formatter, { a: undefined, b: 'evidence' }))),
      some([{ a: undefined, b: 'evidence' }, Route.empty])
    )
  })

  it('parse and toString should be inverse functions', () => {
    const path = '/a%20c?b=b+c'
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
    assert.strictEqual(
      format(
        formatter.contramap(x, (b: { bar: string }) => ({ foo: b.bar.length })),
        { bar: 'baz' }
      ),
      '/3'
    )
  })
})

describe('Match', () => {
  it('imap', () => {
    const y = pipe(
      str('id'),
      imap(
        ({ id }) => ({ userId: id }),
        ({ userId }) => ({ id: userId })
      )
    )
    assert.deepStrictEqual(parse(y.parser, Route.parse('/1'), { userId: '0' }), {
      userId: '1'
    })
    assert.strictEqual(format(y.formatter, { userId: '1' }), '/1')
  })
})

describe('Parser', () => {
  it('map', () => {
    assert.deepStrictEqual(
      parser.map(str('s').parser, (a) => a.s.length).run(Route.parse('/aaa')),
      some([3, Route.empty])
    )
  })

  it('ap', () => {
    const double = (n: number): number => n * 2
    const mab = parser.of(double)
    const ma = parser.of(1)
    assert.deepStrictEqual(parser.ap(mab, ma).run(Route.parse('/')), some([2, Route.empty]))
  })

  it('chain', () => {
    assert.deepStrictEqual(
      parser.chain(str('s').parser, (a) => parser.of(a.s.length)).run(Route.parse('/aaa')),
      some([3, Route.empty])
    )
  })

  it('alt', () => {
    const p = parser.alt(lit('a').parser, () => lit('b').parser)
    assert.deepStrictEqual(p.run(Route.parse('/a')), some([{}, Route.empty]))
    assert.deepStrictEqual(p.run(Route.parse('/b')), some([{}, Route.empty]))
    assert.deepStrictEqual(p.run(Route.parse('/c')), none)
  })

  it('type', () => {
    const T = t.keyof({
      a: null,
      b: null
    })
    const match = pipe(lit('search'), then(type('topic', T)))

    assert.deepStrictEqual(match.parser.run(Route.parse('/search/a')), some([{ topic: 'a' }, Route.empty]))
    assert.deepStrictEqual(match.parser.run(Route.parse('/search/b')), some([{ topic: 'b' }, Route.empty]))
    assert.deepStrictEqual(match.parser.run(Route.parse('/search/')), none)
  })

  it('str', () => {
    assert.deepStrictEqual(str('id').parser.run(Route.parse('/abc')), some([{ id: 'abc' }, new Route([], {})]))
    assert.deepStrictEqual(str('id').parser.run(Route.parse('/')), none)
  })

  it('int', () => {
    assert.deepStrictEqual(int('id').parser.run(Route.parse('/1')), some([{ id: 1 }, new Route([], {})]))
    assert.deepStrictEqual(int('id').parser.run(Route.parse('/a')), none)
    assert.deepStrictEqual(int('id').parser.run(Route.parse('/1a')), none)
    assert.deepStrictEqual(int('id').parser.run(Route.parse('/1.2')), none)
  })

  it('query', () => {
    const DateFromISOString = new t.Type(
      'DateFromISOString',
      (u): u is Date => u instanceof Date,
      (u, c) => {
        const validation = t.string.validate(u, c)
        if (E.isLeft(validation)) {
          return validation as any
        } else {
          const s = validation.right
          const d = new Date(s)
          return isNaN(d.getTime()) ? t.failure(s, c) : t.success(d)
        }
      },
      (a) => a.toISOString()
    )

    assert.strictEqual(
      pipe(
        query(t.interface({ a: t.string, b: IntegerFromString })).parser.run(Route.parse('/foo/bar/?a=baz&b=1')),
        exists(([{ a, b }]) => a === 'baz' && b === 1)
      ),
      true
    )
    const date = '2018-01-18T14:51:47.912Z'

    assert.deepStrictEqual(
      query(t.interface({ a: DateFromISOString })).formatter.run(Route.empty, {
        a: new Date(date)
      }),
      new Route([], { a: date })
    )

    const route = lit('accounts')
      .then(str('accountId'))
      .then(lit('files'))
      .then(query(t.strict({ pathparam: t.string })))
      .formatter.run(Route.empty, { accountId: 'testId', pathparam: '123' })
      .toString()

    assert.strictEqual(route, '/accounts/testId/files?pathparam=123')
  })

  it('query accept undefined ', () => {
    const Q = t.interface({ a: t.union([t.undefined, t.string]) })
    assert.strictEqual(
      pipe(
        query(Q).parser.run(Route.parse('/foo/bar/?a=baz')),
        exists(([{ a }]) => a === 'baz')
      ),
      true
    )
    assert.strictEqual(isSome(query(Q).parser.run(Route.parse('/foo/bar/?b=1'))), true)
    assert.deepStrictEqual(query(Q).formatter.run(Route.empty, { a: undefined }), new Route([], { a: undefined }))
    assert.deepStrictEqual(query(Q).formatter.run(Route.empty, { a: 'baz' }), new Route([], { a: 'baz' }))
  })

  it('query works with partial codecs', () => {
    type StringOrArray = t.TypeOf<typeof stringOrArray>
    const stringOrArray = t.union([t.string, t.array(t.string)])
    const normalize = (v: StringOrArray): Array<string> => (Array.isArray(v) ? v : [v])

    const arrayParam = new t.Type<string | Array<string>, Array<string>>(
      'ArrayParameter',
      (u): u is StringOrArray => stringOrArray.is(u),
      (u, c) => pipe(stringOrArray.validate(u, c), E.map(normalize)),
      normalize
    )

    const Q = t.partial({ a: t.string, b: t.string, c: arrayParam })

    assert.strictEqual(
      pipe(
        query(Q).parser.run(Route.parse('/foo/bar')),
        exists(([{ a, b }]) => a === undefined && b === undefined)
      ),
      true
    )

    assert.strictEqual(
      pipe(
        query(Q).parser.run(Route.parse('/foo/bar?a=baz')),
        exists(([{ a, b }]) => a === 'baz' && b === undefined)
      ),
      true
    )

    assert.strictEqual(
      pipe(
        query(Q).parser.run(Route.parse('/foo/bar?a=baz&b=quu')),
        exists(([{ a, b }]) => a === 'baz' && b === 'quu')
      ),
      true
    )

    assert.strictEqual(
      pipe(
        query(Q).parser.run(Route.parse('/foo/bar?a=baz&c=quu')),
        exists(([{ a, c }]) => a === 'baz' && Array.isArray(c) && arrEquals.equals(c, ['quu']))
      ),
      true
    )

    assert.strictEqual(
      pipe(
        query(Q).parser.run(Route.parse('/foo/bar?a=baz&c=1&c=2&c=3')),
        exists(([{ a, c }]) => a === 'baz' && Array.isArray(c) && arrEquals.equals(c, ['1', '2', '3']))
      ),
      true
    )

    assert.deepStrictEqual(query(Q).formatter.run(Route.empty, {}), new Route([], {}))
    assert.deepStrictEqual(query(Q).formatter.run(Route.empty, { a: 'baz' }), new Route([], { a: 'baz' }))
    assert.deepStrictEqual(
      query(Q).formatter.run(Route.empty, { a: 'baz', b: 'quu' }),
      new Route([], { a: 'baz', b: 'quu' })
    )
  })

  it('query works with array partial', () => {
    const Q = t.partial({ a: t.array(t.string) })

    assert.strictEqual(
      pipe(
        query(Q).parser.run(Route.parse('/foo/bar?a=baz&a=bar')),
        exists(([{ a }]) => Array.isArray(a) && a[0] === 'baz')
      ),
      true
    )

    assert.deepStrictEqual(query(Q).formatter.run(Route.empty, { a: ['baz'] }), new Route([], { a: ['baz'] }))
  })

  it('query deletes extranous params for exact partial codecs', () => {
    const Q = t.exact(t.partial({ a: t.string }))

    assert.strictEqual(
      pipe(
        query(Q).parser.run(Route.parse('/foo/bar?b=baz')),
        exists(([q]) => (q as any)['b'] === undefined)
      ),
      true
    )
  })

  it('succeed', () => {
    assert.deepStrictEqual(succeed({}).parser.run(Route.parse('/')), some([{}, new Route([], {})]))
    assert.deepStrictEqual(succeed({}).parser.run(Route.parse('/a')), some([{}, new Route(['a'], {})]))
    assert.deepStrictEqual(
      succeed({ meaning: 42 }).parser.run(Route.parse('/a')),
      some([{ meaning: 42 }, new Route(['a'], {})])
    )
  })

  it('end', () => {
    const match = end
    assert.deepStrictEqual(match.parser.run(Route.parse('/')), some([{}, new Route([], {})]))
    assert.deepStrictEqual(match.parser.run(Route.parse('/a')), none)
  })

  it('end does not contain a then function', () => {
    // @ts-expect-error
    assert.throws(() => end.then(query(t.type({ foo: t.string }))), TypeError);
  })

  it('lit', () => {
    assert.deepStrictEqual(lit('subview').parser.run(Route.parse('/subview/')), some([{}, new Route([], {})]))
    assert.deepStrictEqual(lit('subview').parser.run(Route.parse('/')), none)
  })

  it('getParserMonoid', () => {
    const monoid = getParserMonoid<{ v: string }>()
    const parser = monoid.concat(
      lit('a')
        .end()
        .parser.map(() => ({ v: 'a' })),
      lit('b')
        .end()
        .parser.map(() => ({ v: 'b' }))
    )
    assert.deepStrictEqual(parser.run(Route.parse('/a')), some([{ v: 'a' }, new Route([], {})]))
    assert.deepStrictEqual(parser.run(Route.parse('/b')), some([{ v: 'b' }, new Route([], {})]))
    assert.deepStrictEqual(parser.run(Route.parse('/c')), none)
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
  const home = lit('home').end()
  const userId = lit('users').then(int('userId'))
  const user = userId.end()
  const invoice = userId.then(lit('invoice')).then(int('invoiceId')).end()

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
    assert.deepStrictEqual(parseLocation('/users/1'), new User(1))
    assert.deepStrictEqual(parseLocation('/users/1/invoice/2'), new Invoice(1, 2))
    assert.strictEqual(parseLocation('/foo'), NotFound.value)
  })

  it('should format a location', () => {
    assert.strictEqual(format(user.formatter, { userId: 1 }), '/users/1')
    assert.strictEqual(format(invoice.formatter, { userId: 1, invoiceId: 2 }), '/users/1/invoice/2')
  })
})
