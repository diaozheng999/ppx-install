ppx-install
=================

Install Esy/OPAM repositories into ReScript

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/ppx-install.svg)](https://npmjs.org/package/ppx-install)
[![Downloads/week](https://img.shields.io/npm/dw/ppx-install.svg)](https://npmjs.org/package/ppx-install)
[![License](https://img.shields.io/npm/l/ppx-install.svg)](https://github.com/diaozheng999/ppx-install/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
* [Declarations](#declarations)
* [How it works](#how-it-works)
<!-- tocstop -->
# Usage
**Step 0**: Add `ppx-install` into `devDependencies`

```sh
npm install --save-dev ppx-install
```

**Step 1**: Add `ppx` key to `package.json`.

```json
{
  "ppx": [
    "@opam/ppx_let",
    "@opam/ppx_sexp_conv"
  ]
}
```

**Step 2**: Add the following into `bsconfig.json`.

```json
{
  "ppx-flags": ["ppx-install"]
}
```

**Step 3 (OPTIONAL)**: Pre-build the PPX rewriters by executing:
```sh
npx ppx-install --build
```

**Step 4**: Ignore the generated `_ppx` directory in `.gitignore`

# Commands

`ppx-install` supports the following commands:

## `--build`

Generate and build a PPX rewriter executable based on definitions. 

```sh
npx ppx-install --build
```

## `--clean`
Removes all traces of the generated project in `_ppx` directory

```sh
npx ppx-install --clean
```

# Declarations

A list of dependencies can be added. These can either be OPAM dependencies or
NPM dependencies understandable by Esy.

Similar to how Esy works with OPAM packages, to declare an OPAM package, simply
use the `@opam` scope.

The following is an example of how it's used:

```javascript
{
  "ppx": [
    ["@opam/ppx_jane", ">=v0.14.0"],  // used to specify a specific version
    "@opam/ppx_sexp_conv",            // unrestricted OPAM package
    "@nasi/ppx-react-native",         // unrestricted NPM package
    ["@nasi/ppx-react-native", "diaozheng999/ppx-react-native"] // git-repositories can also be used as version specifications
  ]
}
```

If `package.json` is not used, you can alternatively define a `ppx.json` file
with the following:

```json
  "package-name": [
    "ppx1",
    "ppx2"
  ]
```

This will automatically creates a project named `ppx_package_name` with the
dependencies installed.

# How it works

`ppx-install` works by generating a Esy project with all the declared
dependencies. It then creates a `dune` file to list out the dependent rewriters
and compile an optimised rewriter that changes the code in one pass.

On executing without any flags (such as through `bsb -make-world`), we first
check and hash the dependencies, and look into the `_ppx` folder for
`_ppx_{md5(deps)}.exe`. If this is found, we simply execute this exe with the
`-as-ppx` flag.

If the executable is not found, we will attempt to generate and build the
project, and execute the rewriter again.

On Windows, Esy requires administrator prompt to allow symlinks. As such, we
automatically prompt and execute the Esy build phase in an Administrator command
prompt.

We always compile to a later version of OCaml (Currently targetting 4.11.x).
Although this is not ideal, the 4.06.1 syntax is a subset of the later versions
and so far it seems to work. Having later versions also allow us to include
newer native targets such as Windows and Apple Silicon macs.

So far, we've only been working with `Ppxlib` rewriters. Older rewriters may
or may not work well. I haven't tested them yet.
