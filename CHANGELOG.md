# Changelog

> **Tags:**
>
> - [New Feature]
> - [Bug Fix]
> - [Breaking Change]
> - [Documentation]
> - [Internal]
> - [Polish]
> - [Experimental]

**Note**: Gaps between patch versions are faulty/broken releases. **Note**: A feature tagged as Experimental is in a
high state of flux, you're at risk of it changing without notice.

# 0.7.0

- **Polish**
  - Type `Route#toString` as `/${string}`

# 0.6.0

- **New Feature**
  - Pipeable methods for parsers and formatters, #63 (@StefanoMagrassi)
- **Bug Fix**
  - Leading slashes, #65 (@StefanoMagrassi)
- **Polish**
  - query fail with array, #60 (@StefanoMagrassi)
- **Internal**
  - Node.js querystring and url dependencies, #58 (@StefanoMagrassi)
  - Remove deprecation, #72 (@StefanoMagrassi)
  - Drop TSLint in favor of ESLint, #73 (@StefanoMagrassi)

# 0.5.4

- **Polish**
  - make `query` work with partial codecs, #54 (@anilanar)

# 0.5.3

- **Bug Fix**
  - don't set `target: es6` in `tsconfig.build-es6.json` (@gcanti)

# 0.5.2

- **Bug Fix**
  - rewrite es6 imports (@gcanti)

# 0.5.1

- **New Feature**
  - add `Parser` monoid instance (@mlegenhausen)
  - add `Parser` monad, alternative instance and related top-level data-last functions (@gcanti)
  - add `Formatter` contravariant instance and related top-level data-last functions (@gcanti)
  - `Match`
    - add top-level data-last function `imap` (@gcanti)
    - add top-level data-last function `then` (@gcanti)

# 0.5.0

- **Breaking Change**
  - upgrade to `fp-ts@2.0.1` and `io-ts@2.0.0` (@gcanti)
  - move `fp-ts@2.0.1` and `io-ts@2.0.0` to `peerDependencies` (@gcanti)

# 0.4.4

- **Bug Fix**
  - remove `fp-ts@2` from dependencies (@gcanti)

# 0.4.3

- **Bug Fix**
  - move `fp-ts` back to dependencies (@gcanti)

# 0.4.2

- **New Feature**
  - make `fp-ts-routing` compatible with both `fp-ts@1.x` and `fp-ts@2.x` (@gcanti)

# 0.4.1

- **Polish**
  - better workaround for #37 (@gcanti)

# 0.4.0

- **Breaking Change**
  - remove `null` from `Query` (@Eldow)
  - discard `undefined` parameters from route params (@Eldow)

# 0.3.9

Make `fp-ts-routing` compatible with `typescript@3.2.0-rc`, closes #34 (@sledorze)

# 0.3.8

- **New Feature**
  - `Query` now accepts `null`s, closes #32 (@sledorze)

# 0.3.7

Make `fp-ts-routing` compatible with `io-ts-types@0.4.0+`, closes #30 (@gcanti)

# 0.3.6

- **New Feature**
  - add `succeed` primitive (@sledorze)

# 0.3.5

- **Internal**
  - upgrade to latest `io-ts-types` (@gcanti)

# 0.3.4

- **New Feature**
  - add option to disable URI encoding/decoding, closes #18 (@gcanti)

# 0.3.3

- **New Feature**
  - add `format` function (@gcanti)
- **Bug Fix**
  - decode/encode pathname parts, fix #12 (@gcanti)
- **Inernal**
  - remove `Route.prototype.inspect` (@gcanti)

# 0.3.2

- **Internal**
  - upgrade to latest versions, fix #8 (@gcanti)
  - make type parameters more strict with `extends object` (@gcanti)

# 0.3.1

- **New Feature**
  - statically avoid overlapping keys (@gcanti)

# 0.3.0

- **Breaking Change**
  - remove `format` argument from `type` (@gcanti)
- **Bug Fix**
  - serialize query in `query` (@gcanti)
- **Internal**
  - upgrade to latest versions (@gcanti)

# 0.2.1

- **Internal**
  - pin `io-ts`, `io-ts-types` versions (@gcanti)

# 0.2.0

- **Breaking Change**
  - upgrade to io-ts 0.9.x (@gcanti)
  - do not re-export `IntegerFromString` (@gcanti)

# 0.1.0

- **Breaking Change**
  - upgrade to fp-ts 0.6 and io-ts 0.8 (@gcanti)

# 0.0.1

Initial release
