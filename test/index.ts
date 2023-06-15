import * as assert from 'assert'
import * as Arr from 'fp-ts/lib/Array'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/function'
import * as S from 'fp-ts/lib/string'
import * as t from 'io-ts'
import * as FTR from '../src'

const arrEquals = Arr.getEq(S.Eq)

describe('IntegerFromString', () => {
  it('is', () => {
    assert.strictEqual(FTR.IntegerFromString.is('a'), false)
    assert.strictEqual(FTR.IntegerFromString.is(1.2), false)
    assert.strictEqual(FTR.IntegerFromString.is(1), true)
  })
})

describe('Route', () => {
  it('parse', () => {
    assert.deepStrictEqual(FTR.Route.parse(''), FTR.Route.empty)
    assert.deepStrictEqual(FTR.Route.parse('/'), FTR.Route.empty)
    assert.deepStrictEqual(FTR.Route.parse('/foo'), new FTR.Route(['foo'], {}))
    assert.deepStrictEqual(FTR.Route.parse('/foo/bar'), new FTR.Route(['foo', 'bar'], {}))
    assert.deepStrictEqual(FTR.Route.parse('/foo/bar/'), new FTR.Route(['foo', 'bar'], {}))
    assert.deepStrictEqual(FTR.Route.parse('/foo/bar?a=1'), new FTR.Route(['foo', 'bar'], { a: '1' }))
    assert.deepStrictEqual(FTR.Route.parse('/foo/bar/?a=1'), new FTR.Route(['foo', 'bar'], { a: '1' }))
    assert.deepStrictEqual(
      FTR.Route.parse('/foo/bar?a=1&a=2&a=3'),
      new FTR.Route(['foo', 'bar'], { a: ['1', '2', '3'] })
    )
    assert.deepStrictEqual(FTR.Route.parse('/a%20b'), new FTR.Route(['a b'], {}))
    assert.deepStrictEqual(FTR.Route.parse('/foo?a=b%20c'), new FTR.Route(['foo'], { a: 'b c' }))
    assert.deepStrictEqual(FTR.Route.parse('/@a'), new FTR.Route(['@a'], {}))
    assert.deepStrictEqual(FTR.Route.parse('/%40a'), new FTR.Route(['@a'], {}))
    assert.deepStrictEqual(FTR.Route.parse('/?a=@b'), new FTR.Route([], { a: '@b' }))
    assert.deepStrictEqual(FTR.Route.parse('/?@a=b'), new FTR.Route([], { '@a': 'b' }))
  })

  it('parse (decode = false)', () => {
    assert.deepStrictEqual(FTR.Route.parse('/%40a', false), new FTR.Route(['%40a'], {}))
  })

  it('toString', () => {
    assert.strictEqual(new FTR.Route([], {}).toString(), '/')
    assert.strictEqual(new FTR.Route(['a'], {}).toString(), '/a')
    assert.strictEqual(new FTR.Route(['a'], { b: 'b' }).toString(), '/a?b=b')
    assert.strictEqual(new FTR.Route(['a'], { b: 'b c' }).toString(), '/a?b=b+c')
    assert.strictEqual(new FTR.Route(['a'], { b: ['1', '2', '3'] }).toString(), '/a?b=1&b=2&b=3')
    assert.strictEqual(new FTR.Route(['a'], { b: undefined }).toString(), '/a')
    assert.strictEqual(new FTR.Route(['a c'], { b: 'b' }).toString(), '/a%20c?b=b')
    assert.strictEqual(new FTR.Route(['@a'], {}).toString(), '/%40a')
    assert.strictEqual(new FTR.Route(['a&b'], {}).toString(), '/a%26b')
    assert.strictEqual(new FTR.Route([], { a: '@b' }).toString(), '/?a=%40b')
    assert.strictEqual(new FTR.Route([], { '@a': 'b' }).toString(), '/?%40a=b')
  })

  it('toString (encode = false)', () => {
    assert.strictEqual(new FTR.Route(['@a'], {}).toString(false), '/@a')
  })

  it('toString discards undefined parameters', () => {
    const stringOrUndefined = t.union([t.undefined, t.string])
    const dummy = FTR.lit('x').then(FTR.query(t.interface({ a: stringOrUndefined, b: stringOrUndefined })))
    assert.deepStrictEqual(
      dummy.parser.run(FTR.Route.parse(FTR.format(dummy.formatter, { a: undefined, b: 'evidence' }))),
      O.some([{ a: undefined, b: 'evidence' }, FTR.Route.empty])
    )
  })

  it('parse and toString should be inverse functions', () => {
    const path = '/a%20c?b=b+c'
    assert.strictEqual(FTR.Route.parse(path).toString(), path)
  })

  it('isEmpty', () => {
    assert.strictEqual(FTR.Route.isEmpty(new FTR.Route([], {})), true)
    assert.strictEqual(FTR.Route.isEmpty(new FTR.Route(['a'], {})), false)
    assert.strictEqual(FTR.Route.isEmpty(new FTR.Route([], { a: 'a' })), false)
  })
})

describe('format', () => {
  it('encode = false', () => {
    const x = FTR.str('username')
    assert.strictEqual(FTR.format(x.formatter, { username: '@giulio' }, false), '/@giulio')
  })
})

describe('Formatter', () => {
  it('contramap', () => {
    const x = new FTR.Formatter((r, a: { foo: number }) => new FTR.Route(r.parts.concat(String(a.foo)), r.query))
    assert.strictEqual(
      FTR.format(
        FTR.formatter.contramap(x, (b: { bar: string }) => ({ foo: b.bar.length })),
        { bar: 'baz' }
      ),
      '/3'
    )

    assert.strictEqual(
      FTR.format(FTR.contramap((b: { bar: string }) => ({ foo: b.bar.length }))(x), { bar: 'baz' }),
      '/3'
    )
  })
})

describe('Match', () => {
  it('imap', () => {
    const y = pipe(
      FTR.str('id'),
      FTR.imap(
        ({ id }) => ({ userId: id }),
        ({ userId }) => ({ id: userId })
      )
    )
    assert.deepStrictEqual(FTR.parse(y.parser, FTR.Route.parse('/1'), { userId: '0' }), {
      userId: '1'
    })
    assert.strictEqual(FTR.format(y.formatter, { userId: '1' }), '/1')
  })
})

describe('Parser', () => {
  it('map', () => {
    assert.deepStrictEqual(
      FTR.parser.map(FTR.str('s').parser, (a) => a.s.length).run(FTR.Route.parse('/aaa')),
      O.some([3, FTR.Route.empty])
    )

    assert.deepStrictEqual(
      pipe(
        FTR.str('s').parser,
        FTR.map((a) => a.s.length)
      ).run(FTR.Route.parse('/aaa')),
      O.some([3, FTR.Route.empty])
    )
  })

  it('ap', () => {
    const double = (n: number): number => n * 2
    const mab = FTR.parser.of(double)
    const ma = FTR.parser.of(1)
    assert.deepStrictEqual(FTR.parser.ap(mab, ma).run(FTR.Route.parse('/')), O.some([2, FTR.Route.empty]))

    assert.deepStrictEqual(FTR.ap(ma)(mab).run(FTR.Route.parse('/')), O.some([2, FTR.Route.empty]))
  })

  it('apFirst', () => {
    const first = FTR.parser.of(1)
    const second = FTR.parser.of(2)

    assert.deepStrictEqual(FTR.apFirst(second)(first).run(FTR.Route.parse('/')), O.some([1, FTR.Route.empty]))
  })

  it('apSecond', () => {
    const first = FTR.parser.of(1)
    const second = FTR.parser.of(2)

    assert.deepStrictEqual(FTR.apSecond(second)(first).run(FTR.Route.parse('/')), O.some([2, FTR.Route.empty]))
  })

  it('chain', () => {
    assert.deepStrictEqual(
      FTR.parser.chain(FTR.str('s').parser, (a) => FTR.parser.of(a.s.length)).run(FTR.Route.parse('/aaa')),
      O.some([3, FTR.Route.empty])
    )

    assert.deepStrictEqual(
      pipe(
        FTR.str('s').parser,
        FTR.chain((a) => FTR.parser.of(a.s.length))
      ).run(FTR.Route.parse('/aaa')),
      O.some([3, FTR.Route.empty])
    )
  })

  it('chainFirst', () => {
    assert.deepStrictEqual(
      pipe(
        FTR.str('s').parser,
        FTR.chainFirst((a) => FTR.parser.of(a.s.length))
      ).run(FTR.Route.parse('/aaa')),
      O.some([{ s: 'aaa' }, FTR.Route.empty])
    )
  })

  it('alt', () => {
    const p = FTR.parser.alt(FTR.lit('a').parser, () => FTR.lit('b').parser)
    assert.deepStrictEqual(p.run(FTR.Route.parse('/a')), O.some([{}, FTR.Route.empty]))
    assert.deepStrictEqual(p.run(FTR.Route.parse('/b')), O.some([{}, FTR.Route.empty]))
    assert.deepStrictEqual(p.run(FTR.Route.parse('/c')), O.none)

    const pp = FTR.alt(() => FTR.lit('b').parser)(FTR.lit('a').parser)
    assert.deepStrictEqual(pp.run(FTR.Route.parse('/a')), O.some([{}, FTR.Route.empty]))
    assert.deepStrictEqual(pp.run(FTR.Route.parse('/b')), O.some([{}, FTR.Route.empty]))
    assert.deepStrictEqual(pp.run(FTR.Route.parse('/c')), O.none)
  })

  it('flatten', () => {
    const inside = FTR.str('s').parser
    const outside = FTR.parser.of(inside)

    assert.deepStrictEqual(FTR.flatten(outside).run(FTR.Route.parse('/aaa')), O.some([{ s: 'aaa' }, FTR.Route.empty]))
  })

  it('type', () => {
    const T = t.keyof({
      a: null,
      b: null
    })
    const match = pipe(FTR.lit('search'), FTR.then(FTR.type('topic', T)))

    assert.deepStrictEqual(match.parser.run(FTR.Route.parse('/search/a')), O.some([{ topic: 'a' }, FTR.Route.empty]))
    assert.deepStrictEqual(match.parser.run(FTR.Route.parse('/search/b')), O.some([{ topic: 'b' }, FTR.Route.empty]))
    assert.deepStrictEqual(match.parser.run(FTR.Route.parse('/search/')), O.none)
  })

  it('str', () => {
    assert.deepStrictEqual(
      FTR.str('id').parser.run(FTR.Route.parse('/abc')),
      O.some([{ id: 'abc' }, new FTR.Route([], {})])
    )
    assert.deepStrictEqual(FTR.str('id').parser.run(FTR.Route.parse('/')), O.none)
  })

  it('int', () => {
    assert.deepStrictEqual(FTR.int('id').parser.run(FTR.Route.parse('/1')), O.some([{ id: 1 }, new FTR.Route([], {})]))
    assert.deepStrictEqual(FTR.int('id').parser.run(FTR.Route.parse('/a')), O.none)
    assert.deepStrictEqual(FTR.int('id').parser.run(FTR.Route.parse('/1a')), O.none)
    assert.deepStrictEqual(FTR.int('id').parser.run(FTR.Route.parse('/1.2')), O.none)
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
        FTR.query(t.interface({ a: t.string, b: FTR.IntegerFromString })).parser.run(
          FTR.Route.parse('/foo/bar/?a=baz&b=1')
        ),
        O.exists(([{ a, b }]) => a === 'baz' && b === 1)
      ),
      true
    )
    const date = '2018-01-18T14:51:47.912Z'

    assert.deepStrictEqual(
      FTR.query(t.interface({ a: DateFromISOString })).formatter.run(FTR.Route.empty, {
        a: new Date(date)
      }),
      new FTR.Route([], { a: date })
    )

    const route = FTR.lit('accounts')
      .then(FTR.str('accountId'))
      .then(FTR.lit('files'))
      .then(FTR.query(t.strict({ pathparam: t.string })))
      .formatter.run(FTR.Route.empty, { accountId: 'testId', pathparam: '123' })
      .toString()

    assert.strictEqual(route, '/accounts/testId/files?pathparam=123')
  })

  it('query accept undefined ', () => {
    const Q = t.interface({ a: t.union([t.undefined, t.string]) })
    assert.strictEqual(
      pipe(
        FTR.query(Q).parser.run(FTR.Route.parse('/foo/bar/?a=baz')),
        O.exists(([{ a }]) => a === 'baz')
      ),
      true
    )
    assert.strictEqual(O.isSome(FTR.query(Q).parser.run(FTR.Route.parse('/foo/bar/?b=1'))), true)
    assert.deepStrictEqual(
      FTR.query(Q).formatter.run(FTR.Route.empty, { a: undefined }),
      new FTR.Route([], { a: undefined })
    )
    assert.deepStrictEqual(FTR.query(Q).formatter.run(FTR.Route.empty, { a: 'baz' }), new FTR.Route([], { a: 'baz' }))
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
        FTR.query(Q).parser.run(FTR.Route.parse('/foo/bar')),
        O.exists(([{ a, b }]) => a === undefined && b === undefined)
      ),
      true
    )

    assert.strictEqual(
      pipe(
        FTR.query(Q).parser.run(FTR.Route.parse('/foo/bar?a=baz')),
        O.exists(([{ a, b }]) => a === 'baz' && b === undefined)
      ),
      true
    )

    assert.strictEqual(
      pipe(
        FTR.query(Q).parser.run(FTR.Route.parse('/foo/bar?a=baz&b=quu')),
        O.exists(([{ a, b }]) => a === 'baz' && b === 'quu')
      ),
      true
    )

    assert.strictEqual(
      pipe(
        FTR.query(Q).parser.run(FTR.Route.parse('/foo/bar?a=baz&c=quu')),
        O.exists(([{ a, c }]) => a === 'baz' && Array.isArray(c) && arrEquals.equals(c, ['quu']))
      ),
      true
    )

    assert.strictEqual(
      pipe(
        FTR.query(Q).parser.run(FTR.Route.parse('/foo/bar?a=baz&c=1&c=2&c=3')),
        O.exists(([{ a, c }]) => a === 'baz' && Array.isArray(c) && arrEquals.equals(c, ['1', '2', '3']))
      ),
      true
    )

    assert.deepStrictEqual(FTR.query(Q).formatter.run(FTR.Route.empty, {}), new FTR.Route([], {}))
    assert.deepStrictEqual(FTR.query(Q).formatter.run(FTR.Route.empty, { a: 'baz' }), new FTR.Route([], { a: 'baz' }))
    assert.deepStrictEqual(
      FTR.query(Q).formatter.run(FTR.Route.empty, { a: 'baz', b: 'quu' }),
      new FTR.Route([], { a: 'baz', b: 'quu' })
    )
  })

  it('query works with array partial', () => {
    const Q = t.partial({ a: t.array(t.string) })

    assert.strictEqual(
      pipe(
        FTR.query(Q).parser.run(FTR.Route.parse('/foo/bar?a=baz&a=bar')),
        O.exists(([{ a }]) => Array.isArray(a) && a[0] === 'baz')
      ),
      true
    )

    assert.deepStrictEqual(
      FTR.query(Q).formatter.run(FTR.Route.empty, { a: ['baz'] }),
      new FTR.Route([], { a: ['baz'] })
    )
  })

  it('query deletes extranous params for exact partial codecs', () => {
    const Q = t.exact(t.partial({ a: t.string }))

    assert.strictEqual(
      pipe(
        FTR.query(Q).parser.run(FTR.Route.parse('/foo/bar?b=baz')),
        O.exists(([q]) => (q as any)['b'] === undefined)
      ),
      true
    )
  })

  it('succeed', () => {
    assert.deepStrictEqual(FTR.succeed({}).parser.run(FTR.Route.parse('/')), O.some([{}, new FTR.Route([], {})]))
    assert.deepStrictEqual(FTR.succeed({}).parser.run(FTR.Route.parse('/a')), O.some([{}, new FTR.Route(['a'], {})]))
    assert.deepStrictEqual(
      FTR.succeed({ meaning: 42 }).parser.run(FTR.Route.parse('/a')),
      O.some([{ meaning: 42 }, new FTR.Route(['a'], {})])
    )
  })

  it('end', () => {
    const match = FTR.end
    assert.deepStrictEqual(match.parser.run(FTR.Route.parse('/')), O.some([{}, new FTR.Route([], {})]))
    assert.deepStrictEqual(match.parser.run(FTR.Route.parse('/a')), O.none)
  })

  it('lit', () => {
    assert.deepStrictEqual(
      FTR.lit('subview').parser.run(FTR.Route.parse('/subview/')),
      O.some([{}, new FTR.Route([], {})])
    )
    assert.deepStrictEqual(FTR.lit('subview').parser.run(FTR.Route.parse('/')), O.none)
  })

  it('getParserMonoid', () => {
    const monoid = FTR.getParserMonoid<{ v: string }>()
    const parser = monoid.concat(
      FTR.lit('a')
        .then(FTR.end)
        .parser.map(() => ({ v: 'a' })),
      FTR.lit('b')
        .then(FTR.end)
        .parser.map(() => ({ v: 'b' }))
    )
    assert.deepStrictEqual(parser.run(FTR.Route.parse('/a')), O.some([{ v: 'a' }, new FTR.Route([], {})]))
    assert.deepStrictEqual(parser.run(FTR.Route.parse('/b')), O.some([{ v: 'b' }, new FTR.Route([], {})]))
    assert.deepStrictEqual(parser.run(FTR.Route.parse('/c')), O.none)
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
  const defaults = FTR.end
  const home = FTR.lit('home').then(FTR.end)
  const userId = FTR.lit('users').then(FTR.int('userId'))
  const user = userId.then(FTR.end)
  const invoice = userId.then(FTR.lit('invoice')).then(FTR.int('invoiceId')).then(FTR.end)

  // router
  const router = FTR.zero<Location>()
    .alt(defaults.parser.map(() => Home.value))
    .alt(home.parser.map(() => Home.value))
    .alt(user.parser.map(({ userId }) => new User(userId)))
    .alt(invoice.parser.map(({ userId, invoiceId }) => new Invoice(userId, invoiceId)))

  // helpers
  const parseLocation = (s: string): Location => FTR.parse(router, FTR.Route.parse(s), NotFound.value)

  it('should match a location', () => {
    assert.strictEqual(parseLocation('/'), Home.value)
    assert.strictEqual(parseLocation('/home'), Home.value)
    assert.deepStrictEqual(parseLocation('/users/1'), new User(1))
    assert.deepStrictEqual(parseLocation('/users/1/invoice/2'), new Invoice(1, 2))
    assert.strictEqual(parseLocation('/foo'), NotFound.value)
  })

  it('should format a location', () => {
    assert.strictEqual(FTR.format(user.formatter, { userId: 1 }), '/users/1')
    assert.strictEqual(FTR.format(invoice.formatter, { userId: 1, invoiceId: 2 }), '/users/1/invoice/2')
  })
})
