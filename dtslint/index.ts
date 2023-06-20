import * as R from '../src'
import * as t from 'io-ts'
import { pipe } from 'fp-ts/lib/pipeable'

// shouldn't type-check when using a duplicate key
// @ts-expect-error
R.str('a').then(R.str('a'))
pipe(
  R.str('a'),
  // @ts-expect-error
  R.then(R.str('a'))
)

declare const BadQuery: t.Type<{ a: string; b: number }, { a: string } & { b: number }>
// @ts-expect-error
R.query(BadQuery)

const PartialQuery = t.partial({ a: t.string })
R.query(PartialQuery)

const ExactPartialQuery = t.exact(t.partial({ a: t.string }))
R.query(ExactPartialQuery)
