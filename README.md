<p align="center">
  <a href="https://comunica.dev/">
    <img alt="Comunica" src="https://comunica.dev/img/comunica_red.svg" width="200">
  </a>
</p>

<p align="center">
  <strong>Reasoning for Comunica</strong>
</p>

<p align="center">
<a href="https://travis-ci.org/comunica/comunica-feature-reasoning"><img src="https://travis-ci.org/comunica/comunica-feature-reasoning.svg?branch=master" alt="Build Status"></a>
<a href="https://coveralls.io/github/comunica/comunica-feature-reasoning?branch=master"><img src="https://coveralls.io/repos/github/comunica/comunica-feature-reasoning/badge.svg?branch=master" alt="Coverage Status"></a>
<a href="https://gitter.im/comunica/Lobby"><img src="https://badges.gitter.im/comunica.png" alt="Gitter chat"></a>
</p>

**[Learn more about Comunica on our website](https://comunica.dev/).**

:construction: This package is in early stages of development

This is a monorepo that contains packages for allowing [Comunica](https://github.com/comunica/comunica) to reason over sources.

<!-- If you want to _use_ an Reasoning-enabled Comunica engine, have a look at [Comunica SPARQL Reasoning](https://github.com/comunica/comunica-feature-reasoning/tree/master/packages/actor-init-sparql-reasoning). -->

<!-- Concretely, this monorepo adds reasoning support to Comunica using the following packages:

TODO: Write this section after developing alpha versions of packages -->

**Warning: All packages in this repo should be considered unstable, and breaking changes may occur at any time.**

## Development Setup

_(JSDoc: https://comunica.github.io/comunica-feature-reasoning/)_

This repository should be used by Comunica module **developers** as it contains multiple Comunica modules that can be composed.
This repository is managed as a [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)
using [Lerna](https://lernajs.io/).

If you want to develop new features
or use the (potentially unstable) in-development version,
you can set up a development environment for Comunica.

Comunica requires [Node.JS](http://nodejs.org/) 8.0 or higher and the [Yarn](https://yarnpkg.com/en/) package manager.
Comunica is tested on OSX, Linux and Windows.

This project can be setup by cloning and installing it as follows:

```bash
$ git clone https://github.com/comunica/comunica-feature-reasoning.git
$ cd comunica
$ yarn install
```

**Note: `npm install` is not supported at the moment, as this project makes use of Yarn's [workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) functionality**

This will install the dependencies of all modules, and bootstrap the Lerna monorepo.
After that, all [Comunica packages](https://github.com/comunica/comunica-feature-reasoning/tree/master/packages) are available in the `packages/` folder
and can be used in a development environment.

Furthermore, this will add [pre-commit hooks](https://www.npmjs.com/package/pre-commit)
to build, lint and test.
These hooks can temporarily be disabled at your own risk by adding the `-n` flag to the commit command.

## License
©2021–present [Jesse Wright](https://github.com/jeswr)
