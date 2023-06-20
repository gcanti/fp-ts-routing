/**
 * @since 0.4.0
 */

/* istanbul ignore file */
// Istanbul has some issues with re-exported symbols, so we temporarly ignore coverage only for this file

import { contramap, format, Formatter, formatter } from './formatter'
import { RowLacks } from './helpers'
import { end, imap, int, IntegerFromString, lit, Match, query, str, succeed, then, type } from './matcher'
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
  map,
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
  contramap,
  /**
   * @category matchers
   * @since 0.4.0
   */
  Match,
  /**
   * @category matchers
   * @since 0.5.1
   */
  imap,
  /**
   * @category matchers
   * @since 0.5.1
   */
  then,
  /**
   * @category matchers
   * @since 0.4.0
   */
  succeed,
  /**
   * @category matchers
   * @since 0.4.0
   */
  end,
  /**
   * @category matchers
   * @since 0.4.0
   */
  type,
  /**
   * @category matchers
   * @since 0.4.0
   */
  str,
  /**
   * @category matchers
   * @since 0.4.2
   */
  IntegerFromString,
  /**
   * @category matchers
   * @since 0.4.0
   */
  int,
  /**
   * @category matchers
   * @since 0.4.0
   */
  lit,
  /**
   * @category matchers
   * @since 0.4.0
   */
  query
}
