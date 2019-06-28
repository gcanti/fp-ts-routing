import { identity, tuple } from 'fp-ts/lib/function'
import { fromEither, fromNullable, none, Option, some, option, isNone } from 'fp-ts/lib/Option'
import { filter, isEmpty } from 'fp-ts/lib/Record'
import { pipe } from 'fp-ts/lib/pipeable'
import { string, Type, Int, failure, success } from 'io-ts'
import { stringify } from 'querystring'
import { parse as parseUrl } from 'url'
import { either } from 'fp-ts/lib/Either'

/**
 * @since 0.4.0
 */
export type QueryValues = string | Array<string> | undefined

/**
 * @since 0.4.0
 */
export interface Query {
  [key: string]: QueryValues
}

/**
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
    const route = parseUrl(s, true)
    const oparts = option.map(fromNullable(route.pathname), s => {
      const r = s.split('/').filter(Boolean)
      return decode ? r.map(decodeURIComponent) : r
    })
    const parts = isNone(oparts) ? [] : oparts.value
    return new Route(parts, Object.assign({}, route.query))
  }
  /**
   * @since 0.4.0
   */
  toString(encode: boolean = true): string {
    const nonUndefinedQuery = pipe(
      this.query,
      filter(value => value !== undefined)
    )
    const qs = stringify(nonUndefinedQuery)
    const parts = encode ? this.parts.map(encodeURIComponent) : this.parts
    return '/' + parts.join('/') + (qs ? '?' + qs : '')
  }
}

const assign = <A>(a: A) => <B>(b: B): A & B => Object.assign({}, a, b)

/**
 * Encodes the constraint that a given object `O`
 * does not contain specific keys `K`
 *
 * @since 0.4.0
 */
export type RowLacks<O extends object, K extends string | number | symbol> = O & Record<Extract<keyof O, K>, never>

/**
 * @since 0.4.0
 */
export class Parser<A extends object> {
  readonly _A!: A
  constructor(readonly run: (r: Route) => Option<[A, Route]>) {}
  /**
   * @since 0.4.0
   */
  static of<A extends object>(a: A): Parser<A> {
    return new Parser(s => some(tuple(a, s)))
  }
  /**
   * @since 0.4.0
   */
  map<B extends object>(f: (a: A) => B): Parser<B> {
    return this.chain(a => Parser.of(f(a))) // <= derived
  }
  /**
   * @since 0.4.0
   */
  ap<B extends object>(fab: Parser<(a: A) => B>): Parser<B> {
    return fab.chain(f => this.map(f)) // <= derived
  }
  /**
   * @since 0.4.0
   */
  chain<B extends object>(f: (a: A) => Parser<B>): Parser<B> {
    return new Parser(r => option.chain(this.run(r), ([a, r2]) => f(a).run(r2)))
  }
  /**
   * @since 0.4.0
   */
  alt(that: Parser<A>): Parser<A> {
    return new Parser(r => {
      const oar = this.run(r)
      return isNone(oar) ? that.run(r) : oar
    })
  }
  /**
   * A mapped Monoidal.mult
   *
   * @since 0.4.0
   */
  then<B extends object>(that: Parser<RowLacks<B, keyof A>>): Parser<A & B> {
    return that.ap(this.map(assign as (a: A) => (b: B) => A & B))
  }
}

/**
 * @since 0.4.0
 */
export function zero<A extends object>(): Parser<A> {
  return new Parser(() => none)
}

/**
 * @since 0.4.0
 */
export function parse<A extends object>(parser: Parser<A>, r: Route, a: A): A {
  const oa = option.map(parser.run(r), ([a]) => a)
  return isNone(oa) ? a : oa.value
}

/**
 * @since 0.4.0
 */
export function format<A extends object>(formatter: Formatter<A>, a: A, encode: boolean = true): string {
  return formatter.run(Route.empty, a).toString(encode)
}

/**
 * @since 0.4.0
 */
export class Formatter<A extends object> {
  readonly _A!: A
  constructor(readonly run: (r: Route, a: A) => Route) {}
  /**
   * @since 0.4.0
   */
  contramap<B extends object>(f: (b: B) => A): Formatter<B> {
    return new Formatter((r, b) => this.run(r, f(b)))
  }
  /**
   * @since 0.4.0
   */
  then<B extends object>(that: Formatter<B> & Formatter<RowLacks<B, keyof A>>): Formatter<A & B> {
    return new Formatter((r, ab) => that.run(this.run(r, ab), ab))
  }
}

/**
 * @since 0.4.0
 */
export class Match<A extends object> {
  readonly _A!: A
  constructor(readonly parser: Parser<A>, readonly formatter: Formatter<A>) {}
  /**
   * @since 0.4.0
   */
  imap<B extends object>(f: (a: A) => B, g: (b: B) => A): Match<B> {
    return new Match(this.parser.map(f), this.formatter.contramap(g))
  }
  /**
   * @since 0.4.0
   */
  then<B extends object>(that: Match<B> & Match<RowLacks<B, keyof A>>): Match<A & B> {
    const p = this.parser.then(that.parser)
    const f = this.formatter.then<B>(that.formatter)
    return new Match(p, f)
  }
}

const singleton = <K extends string, V>(k: K, v: V): { [_ in K]: V } => ({ [k as any]: v } as any)

/**
 * `succeed` matches everything but consumes nothing
 *
 * @since 0.4.0
 */
export function succeed<A extends object>(a: A): Match<A> {
  return new Match(new Parser(r => some(tuple(a, r))), new Formatter(identity))
}

/**
 * `end` matches the end of a route
 * @since 0.4.0
 */
export const end: Match<{}> = new Match(
  new Parser(r => (Route.isEmpty(r) ? some(tuple({}, r)) : none)),
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
 * @since 0.4.0
 */
export function type<K extends string, A>(k: K, type: Type<A, string>): Match<{ [_ in K]: A }> {
  return new Match(
    new Parser(r => {
      if (r.parts.length === 0) {
        return none
      } else {
        const head = r.parts[0]
        const tail = r.parts.slice(1)
        return option.map(fromEither(type.decode(head)), a => tuple(singleton(k, a), new Route(tail, r.query)))
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
    either.chain(string.validate(u, c), s => {
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
 * @since 0.4.0
 */
export function lit(literal: string): Match<{}> {
  return new Match(
    new Parser(r => {
      if (r.parts.length === 0) {
        return none
      } else {
        const head = r.parts[0]
        const tail = r.parts.slice(1)
        return head === literal ? some(tuple({}, new Route(tail, r.query))) : none
      }
    }),
    new Formatter(r => new Route(r.parts.concat(literal), r.query))
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
 *  @since 0.4.0
 */
export function query<A extends object, T>(type: Type<A, Record<keyof T, QueryValues>>): Match<A> {
  return new Match(
    new Parser(r => option.map(fromEither(type.decode(r.query)), query => tuple(query, new Route(r.parts, {})))),
    new Formatter((r, query) => new Route(r.parts, type.encode(query)))
  )
}
