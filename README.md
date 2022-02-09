# VonCount

I vant to count your lines

![Count VonCount](logo.svg "Count VonCount")

<!-- toc -->

- [VonCount](#voncount)
- [Usage](#usage)
- [Commands](#commands)
- [Config](#config)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g voncount
$ voncount COMMAND
running command...
$ voncount (--version)
voncount/0.0.1 darwin-x64 node-v14.15.4
$ voncount --help [COMMAND]
USAGE
  $ voncount COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`voncount help [COMMAND]`](#voncount-help-command)
- [`voncount run PATH`](#voncount-run-path)

## `voncount help [COMMAND]`

Display help for voncount.

```
USAGE
  $ voncount help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for voncount.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.11/src/commands/help.ts)_

## `voncount run PATH`

run a count of a codebase

```
USAGE
  $ voncount run [PATH] [-c <value>]

ARGUMENTS
  PATH  location of codebase

FLAGS
  -c, --config=<value>

DESCRIPTION
  run a count of a codebase
```

_See code: [dist/commands/run/index.ts](https://github.com/royletron/voncount/blob/v0.0.1/dist/commands/run/index.ts)_

<!-- commandsstop -->

# Config

Configuration for `voncount` is totally optional, and can either live in a `count.json` file in the root of your code directory be explicitly provided with the `-c` or `--config` flag.

## What Goes in Config?

### `include`

An array of glob patterns to include, defaults to `['*']`.

#### Examples

Typescript would be:

```json
{
  "include": ["**/*.ts", "**/*.tsx"]
}
```

Go would be:

```json
{
  "include": ["**/*.go"]
}
```

### `exclude`

An array of glob patterns to exclude, defaults to `[]`.

#### Examples

For node you would probably want

```json
{
  "exclude": ["node_modules"]
}
```

### `groups`

A `group` is a specific criteria to search for in the code. It will then be presented back as number of lines that qualify for the group, and as a percentage what that group represents in the code. This is useful for comment, documentation blocks or specific class/function detection (detecting reuse). A block is defined in terms of a regex that matches the start of that block, and another regex that matches the end of that block (with lines counted between those blocks)

#### Examples

For something like comment/documentation blocks where the code looks like:

```tsx
/**
 * A button.
 *
 * @param label: Text to show on the button
 *
 * @example
 *
 * <Button
 *   label="Hello World"
 * />
 *
 * @returns JSX.Element
 *
 * @alpha
 */
```

You would want to match everything between `/**` and ` */`:

```json
{
  "groups": [
    {
      "name": "documentation",
      "between": {
        "start": "^\\/\\*\\*",
        "end": "^ \\*/$"
      }
    }
  ]
}
```

_Be careful to correctly escape your regexs_
