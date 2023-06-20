/**
 * @since 0.6.0
 */

/**
 * Encodes the constraint that a given object `O`
 * does not contain specific keys `K`
 *
 * @category helpers
 * @since 0.4.0
 */
export type RowLacks<O, K extends string | number | symbol> = O & Record<Extract<keyof O, K>, never>
