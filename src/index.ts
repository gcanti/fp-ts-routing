import * as url from 'url'
import { Option, some, none, isNone } from 'fp-ts/lib/Option'
import { StrMap, isEmpty, lookup, remove } from 'fp-ts/lib/StrMap'
import { Tuple } from 'fp-ts/lib/Tuple'
import { Validation, failure as generalFailure, success } from 'fp-ts/lib/Validation'
import { Applicative } from 'fp-ts/lib/Applicative'
import { Alternative } from 'fp-ts/lib/Alternative'
import { monoidArray } from 'fp-ts/lib/Monoid'
import { Either, right, left } from 'fp-ts/lib/Either'
import { fold as foldArray } from 'fp-ts/lib/Array'
import { applySecond as generalApplySecond } from 'fp-ts/lib/Apply'
import { voidRight as generalVoidRight } from 'fp-ts/lib/Functor'

// Adapted from https://github.com/slamdata/purescript-routing

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT<A> {
    Match: Match<A>
  }
}

const failure = <A>(l: Array<MatchError>): Validation<Array<MatchError>, A> => generalFailure(monoidArray, l)

export type Route = {
  parts: Array<string>
  query: Option<StrMap<string>>
}

export function isEmptyRoute(route: Route): boolean {
  return route.parts.length === 0 && isNone(route.query)
}

function sanitize(xs: Array<string>): Array<string> {
  const ys = xs.filter(x => x !== '')
  return ys.length === 0 ? [''] : ys
}

export function parse(hash: string): Route {
  const route = url.parse(hash, true)
  const parts = route.pathname ? sanitize(route.pathname.split('/')) : ['']
  const query = new StrMap<string>(route.query)
  if (isEmpty(query)) {
    return {
      parts,
      query: none
    }
  } else {
    return {
      parts,
      query: some(query)
    }
  }
}

export type MatchError =
  | { type: 'UnexpectedPath'; expected: string; actual: string }
  | { type: 'ExpectedBoolean' }
  | { type: 'ExpectedEnd' }
  | { type: 'ExpectedInt' }
  | { type: 'ExpectedString' }
  | { type: 'ExpectedQuery' }
  | { type: 'ExpectedPathPart' }
  | { type: 'KeyNotFound'; value: string }
  | { type: 'Fail'; value: string }

export function showMatchError(e: MatchError): string {
  switch (e.type) {
    case 'UnexpectedPath':
      return `UnexpectedPath: expected ${JSON.stringify(e.expected)} was ${JSON.stringify(e.actual)}`
    default:
      // TODO
      return JSON.stringify(e)
  }
}

export const URI = 'Match'

export type URI = typeof URI

export class Match<A> {
  static of = of
  static zero = zero
  readonly _A: A
  readonly _URI: URI
  constructor(public readonly run: (route: Route) => Validation<Array<MatchError>, Tuple<Route, A>>) {}
  map<B>(f: (a: A) => B): Match<B> {
    return new Match(r => this.run(r).map(v => v.map(f)))
  }
  of<B>(b: B): Match<B> {
    return of(b)
  }
  ap<B>(fab: Match<(a: A) => B>): Match<B> {
    return new Match(r =>
      fab
        .run(r)
        .fold(
          e => failure(e.concat(this.run(r).fold(e => e, () => []))),
          s1 => this.run(s1.fst()).fold(e => failure(e), s2 => success(new Tuple([s2.fst(), s1.snd()(s2.snd())])))
        )
    )
  }
  ap_<B, C>(this: Match<(a: B) => C>, fb: Match<B>): Match<C> {
    return fb.ap(this)
  }
  alt(fa: Match<A>): Match<A> {
    return new Match(r => this.run(r).alt(fa.run(r)))
  }
  toEither(route: Route): Either<string, A> {
    return this.run(route).fold(e => left(e.map(showMatchError).join(', ')), s => right(s.snd()))
  }
  applySecond<B>(fb: Match<B>): Match<B> {
    return applySecond(this, fb)
  }
}

export interface Match<A> {
  '*>'<B>(fb: Match<B>): Match<B>
}

Match.prototype['*>'] = Match.prototype.applySecond

export function map<A, B>(f: (a: A) => B, fa: Match<A>): Match<B> {
  return fa.map(f)
}

export function of<A>(a: A): Match<A> {
  return new Match(route => success(new Tuple([route, a])))
}

export function ap<A, B>(fab: Match<(a: A) => B>, fa: Match<A>): Match<B> {
  return fa.ap(fab)
}

export function alt<A>(fx: Match<A>, fy: Match<A>): Match<A> {
  return fx.alt(fy)
}

export function zero<A>(): Match<A> {
  return new Match(() => failure([]))
}

export const routing: Applicative<URI> & Alternative<URI> = {
  URI,
  map,
  of,
  ap,
  alt,
  zero
}

const applySecond = generalApplySecond(routing)

export function voidRight<A, B>(a: A, fb: Match<B>): Match<A> {
  return generalVoidRight(routing, a, fb)
}

export function runMatch<A>(match: Match<A>, route: Route): Either<string, A> {
  return match.toEither(route)
}

/**
 * `lit x` will match exactly the path component `x`
 * For example, `lit "x"` matches `/x`
 */
export function lit(s: string): Match<void> {
  return new Match(r => {
    return foldArray(
      () => failure([{ type: 'ExpectedPathPart' }]),
      (head, parts) =>
        head === s
          ? success(new Tuple([{ parts, query: r.query }, undefined]))
          : failure([{ type: 'UnexpectedPath', expected: s, actual: head }]),
      r.parts
    )
  })
}

/**
 * `str` matches any path string component.
 * For example, `str` matches `/foo` as `"foo"`
 */
export const str: Match<string> = new Match(r => {
  return foldArray(
    () => failure([{ type: 'ExpectedString' }]),
    (head, parts) => success(new Tuple([{ parts, query: r.query }, head])),
    r.parts
  )
})

/**
 * `param p` matches a parameter assignment `q=v` within a query block.
 * For example, `param "q"` matches `/?q=a&r=b` as `"a"`
 */
export function param(k: string): Match<string> {
  return new Match(r => {
    return foldArray(
      () =>
        r.query.fold(
          () => failure([{ type: 'ExpectedQuery' }]),
          query =>
            lookup(k, query).fold(
              () => failure([{ type: 'KeyNotFound', value: k }]),
              param => {
                const newQuery = remove(k, query)
                return success(new Tuple([{ parts: r.parts, query: isEmpty(newQuery) ? none : some(newQuery) }, k]))
              }
            )
        ),
      () => failure([{ type: 'ExpectedQuery' }]),
      r.parts
    )
  })
}

/**
 * `params` matches an entire query block. For exmaple, `params`
 * matches `/?q=a&r=b` as the map `{q : "a", r : "b"}`
 */
export function params(s: string): Match<StrMap<string>> {
  return new Match(r =>
    r.query.fold(
      () => failure([{ type: 'ExpectedQuery' }]),
      query => success(new Tuple([{ parts: r.parts, query: none }, query]))
    )
  )
}

/** `int` matches any integer path component */
export const int: Match<number> = new Match(r => {
  return foldArray(
    () => failure([{ type: 'ExpectedInt' }]),
    (head, parts) => {
      const n = parseInt(head, 10)
      return isNaN(n) || n % 1 !== 0
        ? failure([{ type: 'ExpectedInt' }])
        : success(new Tuple([{ parts, query: r.query }, n]))
    },
    r.parts
  )
})

/** `bool` matches any boolean path component */
export const bool: Match<boolean> = new Match(r => {
  return foldArray(
    () => failure([{ type: 'ExpectedBoolean' }]),
    (head, parts) => {
      const r2 = { parts, query: r.query }
      if (head === 'true') {
        return success(new Tuple([r2, true]))
      } else if (head === 'false') {
        return success(new Tuple([r2, false]))
      } else {
        return failure([{ type: 'ExpectedBoolean' }])
      }
    },
    r.parts
  )
})

/** `end` matches the end of a route */
export const end: Match<void> = new Match(
  r => (isEmptyRoute(r) ? success(new Tuple([r, undefined])) : failure([{ type: 'ExpectedEnd' }]))
)

export function fail<A>(s: string): Match<A> {
  return new Match(() => failure([{ type: 'Fail', value: s }]))
}
