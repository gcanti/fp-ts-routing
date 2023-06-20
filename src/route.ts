/**
 * @since 0.6.0
 */
import { isEmpty } from 'fp-ts/lib/Record'

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
