import * as assert from 'assert'
import * as Arr from 'fp-ts/lib/Array'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import * as S from 'fp-ts/lib/string'
import * as t from 'io-ts'

import { format } from '../src/formatter'
import * as M from '../src/matcher'
import { parse } from '../src/parser'
import { Route } from '../src/route'

const arrEquals = Arr.getEq(S.Eq)

describe('IntegerFromString', () => {
  it('is', () => {
    assert.strictEqual(M.IntegerFromString.is('a'), false)
    assert.strictEqual(M.IntegerFromString.is(1.2), false)
    assert.strictEqual(M.IntegerFromString.is(1), true)
  })
})

describe('Match', () => {
  it('imap', () => {
    const match = pipe(
      M.str('id'),
      M.imap(
        ({ id }) => ({ userId: id }),
        ({ userId }) => ({ id: userId })
      )
    )

    assert.deepStrictEqual(parse(match.parser, Route.parse('/1'), { userId: '0' }), {
      userId: '1'
    })

    assert.strictEqual(format(match.formatter, { userId: '1' }), '/1')
  })

  it('type', () => {
    const T = t.keyof({
      a: null,
      b: null
    })
    const match = pipe(M.lit('search'), M.then(M.type('topic', T)))

    assert.deepStrictEqual(match.parser.run(Route.parse('/search/a')), O.some([{ topic: 'a' }, Route.empty]))
    assert.deepStrictEqual(match.parser.run(Route.parse('/search/b')), O.some([{ topic: 'b' }, Route.empty]))
    assert.deepStrictEqual(match.parser.run(Route.parse('/search/')), O.none)
  })

  it('str', () => {
    const match = M.str('id')

    assert.deepStrictEqual(match.parser.run(Route.parse('/abc')), O.some([{ id: 'abc' }, Route.empty]))
    assert.deepStrictEqual(match.parser.run(Route.parse('/')), O.none)
  })

  it('int', () => {
    const match = M.int('id')

    assert.deepStrictEqual(match.parser.run(Route.parse('/1')), O.some([{ id: 1 }, Route.empty]))
    assert.deepStrictEqual(match.parser.run(Route.parse('/a')), O.none)
    assert.deepStrictEqual(match.parser.run(Route.parse('/1a')), O.none)
    assert.deepStrictEqual(match.parser.run(Route.parse('/1.2')), O.none)
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
        M.query(t.type({ a: t.string, b: M.IntegerFromString })).parser.run(Route.parse('/foo/bar/?a=baz&b=1')),
        O.exists(([{ a, b }]) => a === 'baz' && b === 1)
      ),
      true
    )
    const date = '2018-01-18T14:51:47.912Z'

    assert.deepStrictEqual(
      M.query(t.type({ a: DateFromISOString })).formatter.run(Route.empty, {
        a: new Date(date)
      }),
      new Route([], { a: date })
    )

    const route = M.lit('accounts')
      .then(M.str('accountId'))
      .then(M.lit('files'))
      .then(M.query(t.strict({ pathparam: t.string })))
      .formatter.run(Route.empty, { accountId: 'testId', pathparam: '123' })
      .toString()

    assert.strictEqual(route, '/accounts/testId/files?pathparam=123')
  })

  it('query accept undefined ', () => {
    const Q = t.type({ a: t.union([t.undefined, t.string]) })

    assert.strictEqual(
      pipe(
        M.query(Q).parser.run(Route.parse('/foo/bar/?a=baz')),
        O.exists(([{ a }]) => a === 'baz')
      ),
      true
    )
    assert.strictEqual(O.isSome(M.query(Q).parser.run(Route.parse('/foo/bar/?b=1'))), true)
    assert.deepStrictEqual(M.query(Q).formatter.run(Route.empty, { a: undefined }), new Route([], { a: undefined }))
    assert.deepStrictEqual(M.query(Q).formatter.run(Route.empty, { a: 'baz' }), new Route([], { a: 'baz' }))
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
        M.query(Q).parser.run(Route.parse('/foo/bar')),
        O.exists(([{ a, b }]) => a === undefined && b === undefined)
      ),
      true
    )

    assert.strictEqual(
      pipe(
        M.query(Q).parser.run(Route.parse('/foo/bar?a=baz')),
        O.exists(([{ a, b }]) => a === 'baz' && b === undefined)
      ),
      true
    )

    assert.strictEqual(
      pipe(
        M.query(Q).parser.run(Route.parse('/foo/bar?a=baz&b=quu')),
        O.exists(([{ a, b }]) => a === 'baz' && b === 'quu')
      ),
      true
    )

    assert.strictEqual(
      pipe(
        M.query(Q).parser.run(Route.parse('/foo/bar?a=baz&c=quu')),
        O.exists(([{ a, c }]) => a === 'baz' && Array.isArray(c) && arrEquals.equals(c, ['quu']))
      ),
      true
    )

    assert.strictEqual(
      pipe(
        M.query(Q).parser.run(Route.parse('/foo/bar?a=baz&c=1&c=2&c=3')),
        O.exists(([{ a, c }]) => a === 'baz' && Array.isArray(c) && arrEquals.equals(c, ['1', '2', '3']))
      ),
      true
    )

    assert.deepStrictEqual(M.query(Q).formatter.run(Route.empty, {}), Route.empty)
    assert.deepStrictEqual(M.query(Q).formatter.run(Route.empty, { a: 'baz' }), new Route([], { a: 'baz' }))
    assert.deepStrictEqual(
      M.query(Q).formatter.run(Route.empty, { a: 'baz', b: 'quu' }),
      new Route([], { a: 'baz', b: 'quu' })
    )
  })

  it('query works with array partial', () => {
    const Q = t.partial({ a: t.array(t.string) })

    assert.strictEqual(
      pipe(
        M.query(Q).parser.run(Route.parse('/foo/bar?a=baz&a=bar')),
        O.exists(([{ a }]) => Array.isArray(a) && a[0] === 'baz')
      ),
      true
    )

    assert.deepStrictEqual(M.query(Q).formatter.run(Route.empty, { a: ['baz'] }), new Route([], { a: ['baz'] }))
  })

  it('query deletes extranous params for exact partial codecs', () => {
    const Q = t.exact(t.partial({ a: t.string }))

    assert.strictEqual(
      pipe(
        M.query(Q).parser.run(Route.parse('/foo/bar?b=baz')),
        O.exists(([q]) => (q as any)['b'] === undefined)
      ),
      true
    )
  })

  it('succeed', () => {
    const match = M.succeed({})

    assert.deepStrictEqual(match.parser.run(Route.parse('/')), O.some([{}, Route.empty]))
    assert.deepStrictEqual(match.parser.run(Route.parse('/a')), O.some([{}, new Route(['a'], {})]))
    assert.deepStrictEqual(
      M.succeed({ meaning: 42 }).parser.run(Route.parse('/a')),
      O.some([{ meaning: 42 }, new Route(['a'], {})])
    )
  })

  it('end', () => {
    const match = M.end

    assert.deepStrictEqual(match.parser.run(Route.parse('/')), O.some([{}, Route.empty]))
    assert.deepStrictEqual(match.parser.run(Route.parse('/a')), O.none)
  })

  it('lit', () => {
    const match = M.lit('subview')

    assert.deepStrictEqual(match.parser.run(Route.parse('/subview/')), O.some([{}, Route.empty]))
    assert.deepStrictEqual(match.parser.run(Route.parse('/sdfsdf')), O.none)
    assert.deepStrictEqual(match.parser.run(Route.parse('/')), O.none)
  })
})
