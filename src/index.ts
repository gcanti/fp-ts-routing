import * as url from 'url'
import * as querystring from 'querystring'
import { Option, some, none, fromNullable, fromEither } from 'fp-ts/lib/Option'
import { tuple, identity } from 'fp-ts/lib/function'
import * as array from 'fp-ts/lib/Array'
import * as records from 'fp-ts/lib/Record'
import * as t from 'io-ts'
import { IntegerFromString } from 'io-ts-types/lib/number/IntegerFromString'

const isObjectEmpty = (o: object): boolean => {
  for (const _ in o) {
    return false
  }
  return true
}

export type QueryValues = string | Array<string> | undefined
export interface Query {
  [key: string]: QueryValues
}

export class Route {
  static empty = new Route([], {})
  constructor(readonly parts: Array<string>, readonly query: Query) {}
  static isEmpty = (r: Route) => r.parts.length === 0 && isObjectEmpty(r.query)
  static parse = (s: string, decode: boolean = true): Route => {
    const route = url.parse(s, true)
    const parts = fromNullable(route.pathname)
      .map(s => {
        const r = s.split('/').filter(Boolean)
        return decode ? r.map(decodeURIComponent) : r
      })
      .getOrElse([])
    return new Route(parts, route.query)
  }
  toString(encode: boolean = true): string {
    const nonUndefinedQuery = records.filter(this.query, part => part !== undefined)
    const qs = querystring.stringify(nonUndefinedQuery)
    const parts = encode ? this.parts.map(encodeURIComponent) : this.parts
    return '/' + parts.join('/') + (qs ? '?' + qs : '')
  }
}

const assign = <A>(a: A) => <B>(b: B): A & B => Object.assign({}, a, b)

/**
 * Encodes the constraint that a given object `O`
 * does not contain specific keys `K`
 */
export type RowLacks<O extends object, K extends string | number | symbol> = O & Record<Extract<keyof O, K>, never>

export class Parser<A extends object> {
  readonly _A!: A
  constructor(readonly run: (r: Route) => Option<[A, Route]>) {}
  static of = <A extends object>(a: A): Parser<A> => new Parser(s => some(tuple(a, s)))
  map<B extends object>(f: (a: A) => B): Parser<B> {
    return this.chain(a => Parser.of(f(a))) // <= derived
  }
  ap<B extends object>(fab: Parser<(a: A) => B>): Parser<B> {
    return fab.chain(f => this.map(f)) // <= derived
  }
  chain<B extends object>(f: (a: A) => Parser<B>): Parser<B> {
    return new Parser(r => this.run(r).chain(([a, r2]) => f(a).run(r2)))
  }
  alt(that: Parser<A>): Parser<A> {
    return new Parser(r => this.run(r).alt(that.run(r)))
  }
  /** A mapped Monoidal.mult */
  then<B extends object>(that: Parser<RowLacks<B, keyof A>>): Parser<A & B> {
    return that.ap(this.map(assign as (a: A) => (b: B) => A & B))
  }
}

export const zero = <A extends object>(): Parser<A> => new Parser(() => none)

export const parse = <A extends object>(parser: Parser<A>, r: Route, a: A): A =>
  parser
    .run(r)
    .map(([a]) => a)
    .getOrElse(a)

export const format = <A extends object>(formatter: Formatter<A>, a: A, encode: boolean = true): string =>
  formatter.run(Route.empty, a).toString(encode)

export class Formatter<A extends object> {
  readonly _A!: A
  constructor(readonly run: (r: Route, a: A) => Route) {}
  contramap<B extends object>(f: (b: B) => A): Formatter<B> {
    return new Formatter((r, b) => this.run(r, f(b)))
  }
  then<B extends object>(that: Formatter<B> & Formatter<RowLacks<B, keyof A>>): Formatter<A & B> {
    return new Formatter((r, ab) => that.run(this.run(r, ab), ab))
  }
}

export class Match<A extends object> {
  readonly _A!: A
  constructor(readonly parser: Parser<A>, readonly formatter: Formatter<A>) {}
  imap<B extends object>(f: (a: A) => B, g: (b: B) => A): Match<B> {
    return new Match(this.parser.map(f), this.formatter.contramap(g))
  }
  then<B extends object>(that: Match<B> & Match<RowLacks<B, keyof A>>): Match<A & B> {
    const p = this.parser.then(that.parser)
    const f = this.formatter.then<B>(that.formatter)
    return new Match(p, f)
  }
}

const singleton = <K extends string, V>(k: K, v: V): { [_ in K]: V } => ({ [k as any]: v } as any)

/** `succeed` matches everything but consumes nothing */
export const succeed = <A extends object>(a: A): Match<A> =>
  new Match(new Parser(r => some(tuple(a, r))), new Formatter(identity))

/** `end` matches the end of a route */
export const end: Match<{}> = new Match(
  new Parser(r => (Route.isEmpty(r) ? some(tuple({}, r)) : none)),
  new Formatter(identity)
)

/** `type` matches any io-ts type path component */
export const type = <K extends string, A>(k: K, type: t.Type<A, string>): Match<{ [_ in K]: A }> =>
  new Match(
    new Parser(r =>
      array.fold(r.parts, none, (head, tail) =>
        fromEither(type.decode(head)).map(a => tuple(singleton(k, a), new Route(tail, r.query)))
      )
    ),
    new Formatter((r, o) => new Route(r.parts.concat(type.encode(o[k])), r.query))
  )

/** `str` matches any string path component */
export const str = <K extends string>(k: K): Match<{ [_ in K]: string }> => type(k, t.string)

/** `int` matches any integer path component */
export const int = <K extends string>(k: K): Match<{ [_ in K]: number }> => type(k, IntegerFromString)

/**
 * `lit(x)` will match exactly the path component `x`
 * For example, `lit('x')` matches `/x`
 */
export const lit = (literal: string): Match<{}> =>
  new Match(
    new Parser(r =>
      array.fold(r.parts, none, (head, tail) => (head === literal ? some(tuple({}, new Route(tail, r.query))) : none))
    ),
    new Formatter((r, n) => new Route(r.parts.concat(literal), r.query))
  )

export const query = <A extends object>(type: t.Type<A, Query>): Match<A> =>
  new Match(
    new Parser(r => fromEither(type.decode(r.query)).map(query => tuple(query, new Route(r.parts, {})))),
    new Formatter((r, query) => new Route(r.parts, type.encode(query)))
  )
