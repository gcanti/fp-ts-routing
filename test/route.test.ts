import * as assert from 'assert'

import { Route } from '../src/route'

describe('Route', () => {
  it('parse', () => {
    assert.deepStrictEqual(Route.parse(''), Route.empty)
    assert.deepStrictEqual(Route.parse('/'), Route.empty)
    assert.deepStrictEqual(Route.parse('/foo'), new Route(['foo'], {}))
    assert.deepStrictEqual(Route.parse('/foo/bar'), new Route(['foo', 'bar'], {}))
    assert.deepStrictEqual(Route.parse('/foo/bar/'), new Route(['foo', 'bar'], {}))
    assert.deepStrictEqual(Route.parse('/foo/bar?a=1'), new Route(['foo', 'bar'], { a: '1' }))
    assert.deepStrictEqual(Route.parse('/foo/bar/?a=1'), new Route(['foo', 'bar'], { a: '1' }))
    assert.deepStrictEqual(Route.parse('/foo/bar?a=1&a=2&a=3'), new Route(['foo', 'bar'], { a: ['1', '2', '3'] }))
    assert.deepStrictEqual(Route.parse('/a%20b'), new Route(['a b'], {}))
    assert.deepStrictEqual(Route.parse('/foo?a=b%20c'), new Route(['foo'], { a: 'b c' }))
    assert.deepStrictEqual(Route.parse('/@a'), new Route(['@a'], {}))
    assert.deepStrictEqual(Route.parse('/%40a'), new Route(['@a'], {}))
    assert.deepStrictEqual(Route.parse('/?a=@b'), new Route([], { a: '@b' }))
    assert.deepStrictEqual(Route.parse('/?@a=b'), new Route([], { '@a': 'b' }))
  })

  it('parse (decode = false)', () => {
    assert.deepStrictEqual(Route.parse('/%40a', false), new Route(['%40a'], {}))
  })

  it('toString', () => {
    assert.strictEqual(new Route([], {}).toString(), '/')
    assert.strictEqual(new Route(['a'], {}).toString(), '/a')
    assert.strictEqual(new Route(['a'], { b: 'b' }).toString(), '/a?b=b')
    assert.strictEqual(new Route(['a'], { b: 'b c' }).toString(), '/a?b=b+c')
    assert.strictEqual(new Route(['a'], { b: ['1', '2', '3'] }).toString(), '/a?b=1&b=2&b=3')
    assert.strictEqual(new Route(['a'], { b: undefined }).toString(), '/a')
    assert.strictEqual(new Route(['a c'], { b: 'b' }).toString(), '/a%20c?b=b')
    assert.strictEqual(new Route(['@a'], {}).toString(), '/%40a')
    assert.strictEqual(new Route(['a&b'], {}).toString(), '/a%26b')
    assert.strictEqual(new Route([], { a: '@b' }).toString(), '/?a=%40b')
    assert.strictEqual(new Route([], { '@a': 'b' }).toString(), '/?%40a=b')
  })

  it('toString (encode = false)', () => {
    assert.strictEqual(new Route(['@a'], {}).toString(false), '/@a')
  })

  it('parse and toString should be inverse functions', () => {
    const path = '/a%20c?b=b+c'
    assert.strictEqual(Route.parse(path).toString(), path)
  })

  it('isEmpty', () => {
    assert.strictEqual(Route.isEmpty(new Route([], {})), true)
    assert.strictEqual(Route.isEmpty(new Route(['a'], {})), false)
    assert.strictEqual(Route.isEmpty(new Route([], { a: 'a' })), false)
  })
})
