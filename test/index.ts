import * as assert from 'assert'
import { parse, lit, routing, Match, runMatch } from '../src'
import { none, some } from 'fp-ts/lib/Option'
import { StrMap } from 'fp-ts/lib/StrMap'
import { voidRight } from 'fp-ts/lib/Functor'
import { right, left } from 'fp-ts/lib/Either'

describe('parse', () => {
  it('should parse a path', () => {
    assert.deepEqual(parse('/'), {
      parts: [''],
      query: none
    })
    assert.deepEqual(parse('/foo'), {
      parts: ['foo'],
      query: none
    })
    assert.deepEqual(parse('/foo/bar'), {
      parts: ['foo', 'bar'],
      query: none
    })
    assert.deepEqual(parse('/foo/bar/'), {
      parts: ['foo', 'bar'],
      query: none
    })
    assert.deepEqual(parse('/foo/bar?a=1'), {
      parts: ['foo', 'bar'],
      query: some(new StrMap({ a: 1 }))
    })
    assert.deepEqual(parse('/foo/bar/?a=1'), {
      parts: ['foo', 'bar'],
      query: some(new StrMap({ a: 1 }))
    })
  })
})

describe('match', () => {
  it('should match a path', () => {
    class Home {
      public readonly _tag: 'Home' = 'Home'
    }

    class Jupiter {
      public readonly _tag: 'Jupiter' = 'Jupiter'
    }

    type Location = Home | Jupiter

    const home: Match<Location> = voidRight(routing, new Home(), lit(''))
    const jupiter: Match<Location> = voidRight(routing, new Jupiter(), lit('planets').applySecond(lit('jupiter')))

    const routes: Match<Location> = jupiter.alt(home)

    assert.deepEqual(runMatch(routes, parse('/')), right(new Home()))
    assert.deepEqual(runMatch(routes, parse('/planets/jupiter')), right(new Jupiter()))
    assert.deepEqual(runMatch(routes, parse('/planets/mars')), left('UnexpectedPath: expected "" was "planets"'))
  })
})
