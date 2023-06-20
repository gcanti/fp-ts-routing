/**
 * @since 0.6.0
 */
import { Contravariant1 } from 'fp-ts/lib/Contravariant'

import { RowLacks } from './helpers'
import { Route } from './route'

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

/**
 * @category formatters
 * @since 0.5.1
 */
export const contramap =
  <A, B>(f: (b: B) => A) =>
  (fa: Formatter<A>): Formatter<B> =>
    formatter.contramap(fa, f)

/**
 * @category formatters
 * @since 0.6.0
 */
export const then =
  <B>(fb: Formatter<B>) =>
  <A>(fa: Formatter<A> & Formatter<RowLacks<A, keyof B>>): Formatter<A & B> =>
    fa.then(fb as any)

/**
 * @category formatters
 * @since 0.4.0
 */
export const format = <A>(formatter: Formatter<A>, a: A, encode: boolean = true): string =>
  formatter.run(Route.empty, a).toString(encode)
