/**
 * @since 0.4.0
 */
import { Alternative1 } from 'fp-ts/lib/Alternative'
import { either } from 'fp-ts/lib/Either'
import { identity, tuple } from 'fp-ts/lib/function'
import { Monad1 } from 'fp-ts/lib/Monad'
import { Monoid } from 'fp-ts/lib/Monoid'
import { fromEither, isNone, none, Option, option, some } from 'fp-ts/lib/Option'
import { pipeable } from 'fp-ts/lib/pipeable'
import { isEmpty } from 'fp-ts/lib/Record'
import { failure, Int, string, success, Type } from 'io-ts'
import { Contravariant1 } from 'fp-ts/lib/Contravariant'

/**
 * @category routes
 * @since 0.4.0
 */
export type QueryValues = string | Array<string> | undefined

/**
 * @category routes
 * @since 0.4.0
 */
export interface Query {
  [key: string]: QueryValues
}

/**
 * @category routes
 * @since 0.4.0
 */
export class Route {
  /**
   * @since 0.4.0
   */
  static empty = new Route([], {})
  constructor(readonly parts: Array<string>, readonly query: Query) {}
  /**
   * @since 0.4.0
   */
  static isEmpty(r: Route): boolean {
    return r.parts.length === 0 && isEmpty(r.query)
  }
  /**
   * @since 0.4.0
   */
  static parse(s: string, decode: boolean = true): Route {
    const { pathname, searchParams } = new URL(s, 'http://localhost') // `base` is needed when `path` is relative

    const segments = pathname.split('/').filter(Boolean)
    const parts = decode ? segments.map(decodeURIComponent) : segments

    return new Route(parts, toQuery(searchParams))
  }
  /**
   * @since 0.4.0
   */
  toString(encode: boolean = true): string {
    const qs = fromQuery(this.query).toString()
    const parts = encode ? this.parts.map(encodeURIComponent) : this.parts
    return '/' + parts.join('/') + (qs ? '?' + qs : '')
  }
}

const fromQuery = (query: Query): URLSearchParams => {
  const qs = new URLSearchParams()

  Object.entries(query).forEach(([k, v]) => {
    if (typeof v === 'undefined') {
      return
    }

    return Array.isArray(v) ? v.forEach((x) => qs.append(k, x)) : qs.set(k, v)
  })

  return qs
}

const toQuery = (params: URLSearchParams): Query => {
  const q: Query = {}

  params.forEach((v, k) => {
    const current = q[k]

    if (current) {
      q[k] = Array.isArray(current) ? [...current, v] : [current, v]
    } else {
      q[k] = v
    }
  })

  return q
}

const assign =
  <A>(a: A) =>
  <B>(b: B): A & B =>
    Object.assign({}, a, b)

/**
 * Encodes the constraint that a given object `O`
 * does not contain specific keys `K`
 *
 * @since 0.4.0
 */
export type RowLacks<O, K extends string | number | symbol> = O & Record<Extract<keyof O, K>, never>

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    'fp-ts-routing/Parser': Parser<A>
  }
}

const PARSER_URI = 'fp-ts-routing/Parser'

type PARSER_URI = typeof PARSER_URI

/**
 * @category parsers
 * @since 0.4.0
 */
export class Parser<A> {
  /**
   * @since 0.4.0
   */
  readonly _A!: A
  constructor(readonly run: (r: Route) => Option<[A, Route]>) {}
  /**
   * @since 0.4.0
   */
  static of<A>(a: A): Parser<A> {
    return new Parser((s) => some(tuple(a, s)))
  }
  /**
   * @since 0.4.0
   */
  map<B>(f: (a: A) => B): Parser<B> {
    return this.chain((a) => Parser.of(f(a))) // <= derived
  }
  /**
   * @since 0.4.0
   */
  ap<B>(fab: Parser<(a: A) => B>): Parser<B> {
    return fab.chain((f) => this.map(f)) // <= derived
  }
  /**
   * @since 0.4.0
   */
  chain<B>(f: (a: A) => Parser<B>): Parser<B> {
    // tslint:disable-next-line: deprecation
    return new Parser((r) => option.chain(this.run(r), ([a, r2]) => f(a).run(r2)))
  }
  /**
   * @since 0.4.0
   */
  alt(that: Parser<A>): Parser<A> {
    return new Parser((r) => {
      const oar = this.run(r)
      return isNone(oar) ? that.run(r) : oar
    })
  }
  /**
   * @since 0.4.0
   */
  then<B>(that: Parser<RowLacks<B, keyof A>>): Parser<A & B> {
    return that.ap(this.map(assign as (a: A) => (b: B) => A & B))
  }
}

/**
 * @category parsers
 * @since 0.4.0
 */
export function zero<A>(): Parser<A> {
  return new Parser(() => none)
}

/**
 * @category parsers
 * @since 0.4.0
 */
export function parse<A>(parser: Parser<A>, r: Route, a: A): A {
  // tslint:disable-next-line: deprecation
  const oa = option.map(parser.run(r), ([a]) => a)
  return isNone(oa) ? a : oa.value
}

/**
 * @category parsers
 * @since 0.5.1
 */
export const getParserMonoid = <A>(): Monoid<Parser<A>> => ({
  concat: (x, y) => x.alt(y),
  empty: zero<A>()
})

/**
 * @category parsers
 * @since 0.5.1
 */
export const parser: Monad1<PARSER_URI> & Alternative1<PARSER_URI> = {
  URI: PARSER_URI,
  map: (ma, f) => ma.map(f),
  of: Parser.of,
  ap: (mab, ma) => ma.ap(mab),
  chain: (ma, f) => ma.chain(f),
  alt: (fx, f) =>
    new Parser((r) => {
      const oar = fx.run(r)
      return isNone(oar) ? f().run(r) : oar
    }),
  zero
}

// tslint:disable-next-line: deprecation
const { alt, ap, apFirst, apSecond, chain, chainFirst, flatten, map } = pipeable(parser)

export {
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

/**
 * @category formatters
 * @since 0.4.0
 */
export class Formatter<A> {
  /**
   * @since 0.4.0
   */
  readonly _A!: A
  constructor(readonly run: (r: Route, a: A) => Route) {}
  /**
   * @since 0.4.0
   */
  contramap<B>(f: (b: B) => A): Formatter<B> {
    return new Formatter((r, b) => this.run(r, f(b)))
  }
  /**
   * @since 0.4.0
   */
  then<B>(that: Formatter<B> & Formatter<RowLacks<B, keyof A>>): Formatter<A & B> {
    return new Formatter((r, ab) => that.run(this.run(r, ab), ab))
  }
}

/**
 * @category formatters
 * @since 0.4.0
 */
export function format<A>(formatter: Formatter<A>, a: A, encode: boolean = true): string {
  return formatter.run(Route.empty, a).toString(encode)
}

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    'fp-ts-routing/Formatter': Formatter<A>
  }
}

const FORMATTER_URI = 'fp-ts-routing/Formatter'

type FORMATTER_URI = typeof FORMATTER_URI

/**
 * @category formatters
 * @since 0.5.1
 */
export const formatter: Contravariant1<FORMATTER_URI> = {
  URI: FORMATTER_URI,
  contramap: (fa, f) => fa.contramap(f)
}

// tslint:disable-next-line: deprecation
const { contramap } = pipeable(formatter)

export {
  /**
   * @category formatters
   * @since 0.5.1
   */
  contramap
}

/**
 * @category matchers
 * @since 0.6.0
 */
export class MatchEnd<A> {
  /**
   * @since 0.4.0
   */
  readonly _A!: A
  constructor(readonly parser: Parser<A>, readonly formatter: Formatter<A>) {}
}

/**
 * @category matchers
 * @since 0.4.0
 */
export class Match<A> extends MatchEnd<A> {
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

  end(): MatchEnd<A> {
    return this.then(new Match(
      new Parser(r => (Route.isEmpty(r) ? some(tuple({}, r)) : none)),
      new Formatter(identity)
    ))
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
  return new Match(new Parser((r) => some(tuple(a, r))), new Formatter(identity))
}

/**
 * `end` matches the end of a route
 *
 * @category matchers
 * @since 0.4.0
 */
export const end: MatchEnd<{}> = new MatchEnd(
  new Parser((r) => (Route.isEmpty(r) ? some(tuple({}, r)) : none)),
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
        return none
      } else {
        const head = r.parts[0]
        const tail = r.parts.slice(1)
        // tslint:disable-next-line: deprecation
        return option.map(fromEither(type.decode(head)), (a) => tuple(singleton(k, a), new Route(tail, r.query)))
      }
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
    // tslint:disable-next-line: deprecation
    either.chain(string.validate(u, c), (s) => {
      const n = +s
      return isNaN(n) || !Number.isInteger(n) ? failure(s, c) : success(n)
    }),
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
        return none
      } else {
        const head = r.parts[0]
        const tail = r.parts.slice(1)
        return head === literal ? some(tuple({}, new Route(tail, r.query))) : none
      }
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
 * assert.strictEqual(route, '/accounts/testId/files?pathparam=123')
 *
 * @category matchers
 * @since 0.4.0
 */
export function query<A>(type: Type<A, Record<string, QueryValues>>): Match<A> {
  return new Match(
    // tslint:disable-next-line: deprecation
    new Parser((r) => option.map(fromEither(type.decode(r.query)), (query) => tuple(query, new Route(r.parts, {})))),
    new Formatter((r, query) => new Route(r.parts, type.encode(query)))
  )
}
