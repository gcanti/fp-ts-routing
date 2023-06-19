import * as assert from 'assert'
import { pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'

import { Route } from '../src'
import * as P from '../src/parser'

const ROUTE = new Route(['aaa'], {})

const lit = (literal: string) =>
  new P.Parser((r) => {
    if (r.parts.length === 0) {
      return O.none
    }

    return r.parts[0] === literal ? O.some([{}, new Route(r.parts.slice(1), r.query)]) : O.none
  })

type Data = (typeof PARSER)['_A']
const PARSER = P.parser.of({ s: 'aaa' })
const LIT_A = lit('a')
const LIT_B = lit('b')

describe('Parser', () => {
  it('map', () => {
    const fn = (a: Data) => a.s.length
    const result = O.some([3, ROUTE])

    assert.deepStrictEqual(P.parser.map(PARSER, fn).run(ROUTE), result)

    assert.deepStrictEqual(pipe(PARSER, P.map(fn)).run(ROUTE), result)
  })

  it('ap', () => {
    const mab = P.parser.of((n: number) => n * 2)
    const ma = P.parser.of(1)
    const result = O.some([2, ROUTE])

    assert.deepStrictEqual(P.parser.ap(mab, ma).run(ROUTE), result)

    assert.deepStrictEqual(P.ap(ma)(mab).run(ROUTE), result)
  })

  it('apFirst', () => {
    const first = P.parser.of(1)
    const second = P.parser.of(2)

    assert.deepStrictEqual(P.apFirst(second)(first).run(ROUTE), O.some([1, ROUTE]))
  })

  it('apSecond', () => {
    const first = P.parser.of(1)
    const second = P.parser.of(2)

    assert.deepStrictEqual(P.apSecond(second)(first).run(ROUTE), O.some([2, ROUTE]))
  })

  it('chain', () => {
    const fn = (a: Data) => P.parser.of(a.s.length)
    const result = O.some([3, ROUTE])

    assert.deepStrictEqual(P.parser.chain(PARSER, fn).run(ROUTE), result)

    assert.deepStrictEqual(pipe(PARSER, P.chain(fn)).run(ROUTE), result)
  })

  it('chainFirst', () => {
    assert.deepStrictEqual(
      pipe(
        PARSER,
        P.chainFirst((a) => P.parser.of(a.s.length))
      ).run(ROUTE),
      O.some([{ s: 'aaa' }, ROUTE])
    )
  })

  it('alt', () => {
    const x = P.parser.alt(LIT_A, () => LIT_B)
    assert.deepStrictEqual(x.run(Route.parse('/a')), O.some([{}, Route.empty]))
    assert.deepStrictEqual(x.run(Route.parse('/b')), O.some([{}, Route.empty]))
    assert.deepStrictEqual(x.run(Route.parse('/c')), O.none)

    const y = P.alt(() => LIT_A)(LIT_B)
    assert.deepStrictEqual(y.run(Route.parse('/a')), O.some([{}, Route.empty]))
    assert.deepStrictEqual(y.run(Route.parse('/b')), O.some([{}, Route.empty]))
    assert.deepStrictEqual(y.run(Route.parse('/c')), O.none)
  })

  it('then', () => {
    const x = LIT_A.then(LIT_B)

    assert.deepStrictEqual(x.run(Route.parse('/a/b')), O.some([{}, Route.empty]))
    assert.deepStrictEqual(x.run(Route.parse('/a/c')), O.none)
  })

  it('flatten', () => {
    const inside = PARSER
    const outside = P.parser.of(inside)

    assert.deepStrictEqual(P.flatten(outside).run(ROUTE), O.some([{ s: 'aaa' }, ROUTE]))
  })

  it('zero', () => {
    assert.deepStrictEqual(P.zero().run(ROUTE), O.none)
  })

  it('parse', () => {
    const p = new P.Parser((r) => (r.parts[0] === 'a' ? O.some(['aaa', Route.empty]) : O.none))

    assert.deepStrictEqual(P.parse(p, Route.parse('/a'), 'bbb'), 'aaa')
    assert.deepStrictEqual(P.parse(p, Route.empty, 'bbb'), 'bbb')
  })

  it('getParserMonoid', () => {
    const monoid = P.getParserMonoid<{ v: string }>()
    const parser = monoid.concat(
      LIT_A.map(() => ({ v: 'a' })),
      LIT_B.map(() => ({ v: 'b' }))
    )
    assert.deepStrictEqual(parser.run(Route.parse('/a')), O.some([{ v: 'a' }, Route.empty]))
    assert.deepStrictEqual(parser.run(Route.parse('/b')), O.some([{ v: 'b' }, Route.empty]))
    assert.deepStrictEqual(parser.run(Route.parse('/c')), O.none)
  })
})
