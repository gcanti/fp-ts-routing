import * as assert from 'assert'
import { pipe } from 'fp-ts/lib/function'
import * as t from 'io-ts'

import * as F from '../src/formatter'
import { Route } from '../src/route'

const FORMATTER = (k: string) =>
  new F.Formatter<any>((r, o) => new Route(r.parts.concat(t.string.encode(o[k])), r.query))

describe('format', () => {
  it('encode = true', () => {
    const x = FORMATTER('username')
    assert.strictEqual(F.format(x, { username: '@giulio' }), '/%40giulio')
  })

  it('encode = false', () => {
    const x = FORMATTER('username')
    assert.strictEqual(F.format(x, { username: '@giulio' }, false), '/@giulio')
  })
})

describe('Formatter', () => {
  it('then', () => {
    const x = FORMATTER('username').then(FORMATTER('foo'))
    const y = pipe(FORMATTER('username'), F.then(FORMATTER('foo')))

    assert.strictEqual(F.format(x, { username: 'test', foo: 'bar' }), '/test/bar')
    assert.strictEqual(F.format(y, { username: 'test', foo: 'bar' }), '/test/bar')
  })

  it('contramap', () => {
    const x = new F.Formatter((r, a: { foo: number }) => new Route(r.parts.concat(String(a.foo)), r.query))

    assert.strictEqual(
      F.format(
        F.formatter.contramap(x, (b: { bar: string }) => ({ foo: b.bar.length })),
        { bar: 'baz' }
      ),
      '/3'
    )

    assert.strictEqual(F.format(F.contramap((b: { bar: string }) => ({ foo: b.bar.length }))(x), { bar: 'baz' }), '/3')
  })
})
