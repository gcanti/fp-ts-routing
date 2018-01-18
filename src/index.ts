import * as url from 'url'
import * as querystring from 'querystring'
import { Option, some, none, fromNullable } from 'fp-ts/lib/Option'
import { tuple, identity } from 'fp-ts/lib/function'
import * as array from 'fp-ts/lib/Array'
import * as t from 'io-ts'
import { IntegerFromString } from 'io-ts-types/lib/number/IntegerFromString'

const isObjectEmpty = (o: object): boolean => {
  for (const k in o) {
    return k === null
  }
  return true
}

export class Route {
  static empty = new Route([], {})
  constructor(readonly parts: Array<string>, readonly query: { [key: string]: string }) {}
  static isEmpty = (r: Route) => r.parts.length === 0 && isObjectEmpty(r.query)
  static parse = (s: string): Route => {
    const route: url.Url = url.parse(s, true)
    const parts = fromNullable(route.pathname)
      .map(s => s.split('/').filter(x => Boolean(x)))
      .getOrElse(() => [])
    return new Route(parts, route.query)
  }
  inspect(): string {
    return this.toString()
  }
  toString(): string {
    const qs = querystring.stringify(this.query)
    return '/' + this.parts.join('/') + (qs ? '?' + qs : '')
  }
}

const assign = <A>(a: A) => <B>(b: B): A & B => Object.assign({}, a, b)

export class Parser<A> {
  constructor(readonly run: (r: Route) => Option<[A, Route]>) {}
  static of = <A>(a: A): Parser<A> => new Parser(s => some(tuple(a, s)))
  map<B>(f: (a: A) => B): Parser<B> {
    return this.chain(a => Parser.of(f(a))) // <= derived
  }
  ap<B>(fab: Parser<(a: A) => B>): Parser<B> {
    return fab.chain(f => this.map(f)) // <= derived
  }
  chain<B>(f: (a: A) => Parser<B>): Parser<B> {
    return new Parser(r => this.run(r).chain(([a, r2]) => f(a).run(r2)))
  }
  alt(that: Parser<A>): Parser<A> {
    return new Parser(r => this.run(r).alt(that.run(r)))
  }
  /** A mapped Monoidal.mult */
  then<B>(that: Parser<B>): Parser<A & B> {
    return that.ap(this.map(assign))
  }
}

export const zero = <A>(): Parser<A> => new Parser(() => none)

export const parse = <A>(parser: Parser<A>, r: Route, a: A): A =>
  parser
    .run(r)
    .map(([a]) => a)
    .getOrElse(() => a)

export class Formatter<A> {
  constructor(readonly run: (r: Route, a: A) => Route) {}
  contramap<B>(f: (b: B) => A): Formatter<B> {
    return new Formatter((r, b) => this.run(r, f(b)))
  }
  then<B>(that: Formatter<B>): Formatter<A & B> {
    return new Formatter((r, ab) => that.run(this.run(r, ab), ab))
  }
}

export class Match<A> {
  constructor(readonly parser: Parser<A>, readonly formatter: Formatter<A>) {}
  imap<B>(f: (a: A) => B, g: (b: B) => A): Match<B> {
    return new Match(this.parser.map(f), this.formatter.contramap(g))
  }
  then<B>(that: Match<B>): Match<A & B> {
    return new Match(this.parser.then(that.parser), this.formatter.then(that.formatter))
  }
}

const singleton = <K extends string, V>(k: K, v: V): { [_ in K]: V } => ({ [k as any]: v } as any)

/** `end` matches the end of a route */
export const end: Match<{}> = new Match(
  new Parser(r => (Route.isEmpty(r) ? some(tuple({}, r)) : none)),
  new Formatter(identity)
)

/** `type` matches any io-ts type path component */
export const type = <K extends string, A>(k: K, type: t.Type<string, A>): Match<{ [_ in K]: A }> =>
  new Match(
    new Parser(r =>
      array.fold(
        () => none,
        (head, tail) =>
          t
            .validate(head, type)
            .toOption()
            .map(a => tuple(singleton(k, a), new Route(tail, r.query))),
        r.parts
      )
    ),
    new Formatter((r, o) => new Route(r.parts.concat(type.serialize(o[k])), r.query))
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
      array.fold(
        () => none,
        (head, tail) => (head === literal ? some(tuple({}, new Route(tail, r.query))) : none),
        r.parts
      )
    ),
    new Formatter((r, n) => new Route(r.parts.concat(literal), r.query))
  )

export const query = <T extends t.Any>(type: T): Match<t.TypeOf<T>> =>
  new Match(
    new Parser(r =>
      t
        .validate(r.query, type)
        .toOption()
        .map(query => tuple(query, new Route(r.parts, {})))
    ),
    new Formatter((r, query) => new Route(r.parts, type.serialize(query)))
  )
