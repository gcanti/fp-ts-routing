import { exec } from 'child_process'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as Arr from 'fp-ts/ReadonlyArray'
import * as TE from 'fp-ts/TaskEither'
import { promisify } from 'util'

// --- Exec command
const exec$ = (command: string) => TE.tryCatch(() => promisify(exec)(command), E.toError)

// --- Version handling
const ERROR_VERSION_REGEXP = /ERROR:(?:.)*TypeScript@([^\s]*)/

type Version = [major: number, minor: number]

const parse10 = (s: string): O.Option<number> => {
  const result = parseInt(s, 10)

  return isNaN(result) || !Number.isInteger(result) ? O.none : O.some(result)
}

const versionFromString = (s: string): O.Option<Version> =>
  pipe(
    s.split('.').slice(0, 2),
    Arr.map(parse10),
    O.sequenceArray,
    O.map(([maj, min]) => [maj, min])
  )

const tsVersionFromErr = (s: string): O.Option<Version> =>
  pipe(
    s.match(ERROR_VERSION_REGEXP),
    O.fromNullable,
    O.chain(([_, m]) => versionFromString(m))
  )

const isHigherThan =
  (second: Version) =>
  (first: Version): boolean => {
    const [maj1, min1] = first
    const [maj2, min2] = second

    return maj1 > maj2 || min1 > min2
  }

// --- Get latest version
const stable = pipe(
  exec$('npm view typescript --json dist-tags.latest'),
  TE.chain(({ stdout }) =>
    pipe(
      stdout.trim().replace('"', ''),
      versionFromString,
      TE.fromOption(() => new Error('Cannot derive stable version'))
    )
  )
)

// --- Run dtslint ignoring error from beta version
const warning = (msg: string): string => `
> WARNING!
> dtslint threw this error for TS beta versions:

================================================
${msg
  .split('\n')
  .map((l) => `| ${l}`)
  .join('\n')}
================================================
`

const dtslint = (stableVersion: Version) =>
  pipe(
    exec$('dtslint --expectOnly dtslint'),
    TE.map(({ stdout }) => stdout),
    TE.orElse((e) =>
      pipe(
        e.message.split('\n'),
        Arr.map(tsVersionFromErr),
        O.sequenceArray,
        O.map(Arr.every(isHigherThan(stableVersion))),
        O.getOrElse(() => true),
        (ignore) => (ignore ? TE.right(warning(e.message)) : TE.left(e))
      )
    )
  )

// --- Run script
pipe(stable, TE.chain(dtslint))()
  .then(
    E.match(
      (e) => {
        console.error(e)

        process.exitCode = 1
      },
      (msg) => {
        console.log(msg)

        process.exitCode = 0
      }
    )
  )
  .catch(console.error)
