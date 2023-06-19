/**
 * @since 0.4.0
 */
import * as E from 'fp-ts/lib/Either'
import { identity } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
// This `pipe` version is deprecated, but provided by `fp-ts` v2.0.1 and higher.
import { pipe } from 'fp-ts/lib/pipeable'
import { failure, Int, string, success, Type } from 'io-ts'

import { contramap, format, Formatter, formatter } from './formatter'
import { RowLacks } from './helpers'
import {
  alt,
  ap,
  apFirst,
  apSecond,
  chain,
  chainFirst,
  flatten,
  getParserMonoid,
  map,
  parse,
  Parser,
  parser,
  zero
} from './parser'
import { QueryValues, Route } from './route'

// --- Re-exports
export * from './route'

export {
  /**
   * @category helpers
   * @since 0.4.0
   */
  RowLacks,
  /**
   * @category parsers
   * @since 0.4.0
   */
  Parser,
  /**
   * @category parsers
   * @since 0.4.0
   */
  zero,
  /**
   * @category parsers
   * @since 0.4.0
   */
  parse,
  /**
   * @category parsers
   * @since 0.5.1
   */
  getParserMonoid,
  /**
   * @category parsers
   * @since 0.5.1
   */
  parser,
  /**
   * @category parsers
   * @since 0.5.1
   */
  alt,
  /**
   * @category parsers
   * @since 0.5.1
   */
  ap,
  /**
   * @category parsers
   * @since 0.5.1
   */
  apFirst,
  /**
   * @category parsers
   * @since 0.5.1
   */
  apSecond,
  /**
   * @category parsers
   * @since 0.5.1
   */
  chain,
  /**
   * @category parsers
   * @since 0.5.1
   */
  chainFirst,
  /**
   * @category parsers
   * @since 0.5.1
   */
  flatten,
  /**
   * @category parsers
   * @since 0.5.1
   */
  map
}

export {
  /**
   * @category formatters
   * @since 0.4.0
   */
  Formatter,
  /**
   * @category formatters
   * @since 0.4.0
   */
  format,
  /**
   * @category formatters
   * @since 0.5.1
   */
  formatter,
  /**
   * @category formatters
   * @since 0.5.1
   */
  contramap
}
// ---

/**
 * @category matchers
 * @since 0.4.0
 */
export class Match<A> {
  /**
   * @since 0.4.0
   */
  readonly _A!: A
  constructor(readonly parser: Parser<A>, readonly formatter: Formatter<A>) {}
  /**
   * @since 0.4.0
   */
  imap<B>(f: (a: A) => B, g: (b: B) => A): Match<B> {
    return new Match(this.parser.map(f), this.formatter.contramap(g))
  }
  /**
   * @since 0.4.0
   */
  then<B>(that: Match<B> & Match<RowLacks<B, keyof A>>): Match<A & B> {
    const p = this.parser.then(that.parser)
    const f = this.formatter.then<B>(that.formatter)
    return new Match(p, f)
  }
}

/**
 * @category matchers
 * @since 0.5.1
 */
export function imap<A, B>(f: (a: A) => B, g: (b: B) => A): (ma: Match<A>) => Match<B> {
  return (ma) => ma.imap(f, g)
}

/**
 * @category matchers
 * @since 0.5.1
 */
export function then<B>(mb: Match<B>): <A>(ma: Match<A> & Match<RowLacks<A, keyof B>>) => Match<A & B> {
  return (ma) => ma.then(mb as any)
}

const singleton = <K extends string, V>(k: K, v: V): { [_ in K]: V } => ({ [k as any]: v } as any)

/**
 * `succeed` matches everything but consumes nothing
 *
 * @category matchers
 * @since 0.4.0
 */
export function succeed<A>(a: A): Match<A> {
  return new Match(new Parser((r) => O.some([a, r])), new Formatter(identity))
}

/**
 * `end` matches the end of a route
 *
 * @category matchers
 * @since 0.4.0
 */
export const end: Match<{}> = new Match(
  new Parser((r) => (Route.isEmpty(r) ? O.some([{}, r]) : O.none)),
  new Formatter(identity)
)

/**
 * `type` matches any io-ts type path component
 *
 * @example
 * import * as t from 'io-ts'
 * import { lit, type, Route } from 'fp-ts-routing'
 * import { some, none } from 'fp-ts/lib/Option'
 *
 * const T = t.keyof({
 *   a: null,
 *   b: null
 * })
 *
 * const match = lit('search').then(type('topic', T))
 *
 * assert.deepStrictEqual(match.parser.run(Route.parse('/search/a')), some([{ topic: 'a' }, Route.empty]))
 * assert.deepStrictEqual(match.parser.run(Route.parse('/search/b')), some([{ topic: 'b' }, Route.empty]))
 * assert.deepStrictEqual(match.parser.run(Route.parse('/search/')), none)
 *
 * @category matchers
 * @since 0.4.0
 */
export function type<K extends string, A>(k: K, type: Type<A, string>): Match<{ [_ in K]: A }> {
  return new Match(
    new Parser((r) => {
      if (r.parts.length === 0) {
        return O.none
      }

      return pipe(
        type.decode(r.parts[0]),
        O.fromEither,
        O.map((a) => [singleton(k, a), new Route(r.parts.slice(1), r.query)])
      )
    }),
    new Formatter((r, o) => new Route(r.parts.concat(type.encode(o[k])), r.query))
  )
}

/**
 * `str` matches any string path component
 *
 * @example
 * import { str, Route } from 'fp-ts-routing'
 * import { some, none } from 'fp-ts/lib/Option'
 *
 * assert.deepStrictEqual(str('id').parser.run(Route.parse('/abc')), some([{ id: 'abc' }, new Route([], {})]))
 * assert.deepStrictEqual(str('id').parser.run(Route.parse('/')), none)
 *
 * @category matchers
 * @since 0.4.0
 */
export function str<K extends string>(k: K): Match<{ [_ in K]: string }> {
  return type(k, string)
}

/**
 * @internal
 */
export const IntegerFromString = new Type<number, string, unknown>(
  'IntegerFromString',
  (u): u is number => Int.is(u),
  (u, c) =>
    pipe(
      string.validate(u, c),
      E.chain((s) => {
        const n = +s
        return isNaN(n) || !Number.isInteger(n) ? failure(s, c) : success(n)
      })
    ),
  String
)

/**
 * `int` matches any integer path component
 *
 * @example
 * import { int, Route } from 'fp-ts-routing'
 * import { some, none } from 'fp-ts/lib/Option'
 *
 * assert.deepStrictEqual(int('id').parser.run(Route.parse('/1')), some([{ id: 1 }, new Route([], {})]))
 * assert.deepStrictEqual(int('id').parser.run(Route.parse('/a')), none)
 *
 * @category matchers
 * @since 0.4.0
 */
export function int<K extends string>(k: K): Match<{ [_ in K]: number }> {
  return type(k, IntegerFromString)
}

/**
 * `lit(x)` will match exactly the path component `x`
 *
 * @example
 * import { lit, Route } from 'fp-ts-routing'
 * import { some, none } from 'fp-ts/lib/Option'
 *
 * assert.deepStrictEqual(lit('subview').parser.run(Route.parse('/subview/')), some([{}, new Route([], {})]))
 * assert.deepStrictEqual(lit('subview').parser.run(Route.parse('/')), none)
 *
 * @category matchers
 * @since 0.4.0
 */
export function lit(literal: string): Match<{}> {
  return new Match(
    new Parser((r) => {
      if (r.parts.length === 0) {
        return O.none
      }

      return r.parts[0] === literal ? O.some([{}, new Route(r.parts.slice(1), r.query)]) : O.none
    }),
    new Formatter((r) => new Route(r.parts.concat(literal), r.query))
  )
}

/**
 * Will match a querystring.
 *
 *
 * **Note**. Use `io-ts`'s `strict` instead of `type` otherwise excess properties won't be removed.
 *
 * @example
 * import * as t from 'io-ts'
 * import { lit, str, query, Route } from 'fp-ts-routing'
 *
 * const route = lit('accounts')
 *   .then(str('accountId'))
 *   .then(lit('files'))
 *   .then(query(t.strict({ pathparam: t.string })))
 *   .formatter.run(Route.empty, { accountId: 'testId', pathparam: '123' })
 *   .toString()
 *
 * assert.strictEqual(route, '/accounts/testId/files?pathparam=123')
 *
 * @category matchers
 * @since 0.4.0
 */
export function query<A>(type: Type<A, Record<string, QueryValues>>): Match<A> {
  return new Match(
    new Parser((r) =>
      pipe(
        type.decode(r.query),
        O.fromEither,
        O.map((query) => [query, new Route(r.parts, {})])
      )
    ),
    new Formatter((r, query) => new Route(r.parts, type.encode(query)))
  )
}
