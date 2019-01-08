import { str, query } from '../src'
import * as t from 'io-ts'

// shouldn't type-check when using a duplicate key
// $ExpectError
const m = str('a').then(str('a'))

declare const BadQuery: t.Type<{ a: string; b: number }, { a: string } & { b: number }>
// $ExpectError
query(BadQuery)
