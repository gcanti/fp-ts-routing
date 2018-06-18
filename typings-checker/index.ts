import { str } from '../src'

// shouldn't type-check when using a duplicate key
// $ExpectError Argument of type 'Match<{ a: string; }>' is not assignable to parameter of type 'Match<{ a: string; }> & Match<RowLacks<{ a: string; }, "a">>'
const m = str('a').then(str('a'))
