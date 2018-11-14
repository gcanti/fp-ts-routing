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

# 0.3.7

Make `fp-ts-routing` compatible with `io-ts-types#0.4.0+`, closes #30 (@gcanti)

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
