# Comunica SPARQL Link Traversal Init Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-init-sparql-reasoning.svg)](https://www.npmjs.com/package/@comunica/actor-init-sparql-link-traversal)
[![Docker Pulls](https://img.shields.io/docker/pulls/comunica/actor-init-sparql-reasoning.svg)](https://hub.docker.com/r/comunica/actor-init-sparql-reasoning/)

Comunica SPARQL Reasoner is a SPARQL query engine for JavaScript that applies reasoning over sources.

This module is part of the [Comunica framework](https://comunica.dev/).

## Install

```bash
$ yarn add @comunica/actor-init-sparql-reasoning
```

or

```bash
$ npm install -g @comunica/actor-init-sparql-reasoning
```

## Usage

Get all classes (including subClass relations):

```bash
$ comunica-sparql-reasoning https://www.rubensworks.net/ \
  "SELECT DISTINCT * WHERE {
       <https://www.rubensworks.net/#me> a ?o.
   }"
```

Show the help with all options:

```bash
$ comunica-sparql-reasoning --help
```

Just like [Comunica SPARQL](https://github.com/comunica/comunica/tree/master/packages/actor-init-sparql),
a [dynamic variant](https://github.com/comunica/comunica/tree/master/packages/actor-init-sparql#usage-from-the-command-line) (`comunica-dynamic-sparql-reasoning`) also exists.

_[**Read more** about querying from the command line](https://comunica.dev/docs/query/getting_started/query_cli/)._

### Usage within application

This engine can be used in JavaScript/TypeScript applications as follows:

```javascript
const newEngine = require('@comunica/actor-init-sparql-reasoning').newEngine;
const myEngine = newEngine();

const result = await myEngine.query(`
  SELECT DISTINCT * WHERE {
      <https://www.rubensworks.net/#me> a ?o.
  }`, {
  sources: ['https://www.rubensworks.net/'],
  lenient: true,
});

// Consume results as a stream (best performance)
result.bindingsStream.on('data', (binding) => {
    console.log(binding.get('?o').value);
});

// Consume results as an array (easier)
const bindings = await result.bindings();
console.log(bindings[0].get('?o').value);
console.log(bindings[0].get('?o').termType);
```

_[**Read more** about querying an application](https://comunica.dev/docs/query/getting_started/query_app/)._

### Usage as a SPARQL endpoint

Start a webservice exposing http://fragments.dbpedia.org/2015-10/en via the SPARQL protocol, i.e., a _SPARQL endpoint_.

```bash
$ comunica-sparql-reasoning-http https://www.rubensworks.net/
```

Show the help with all options:

```bash
$ comunica-sparql-reasoning
```

The SPARQL endpoint can only be started dynamically.
An alternative config file can be passed via the `COMUNICA_CONFIG` environment variable.

Use `bin/http.js` when running in the Comunica monorepo development environment.

_[**Read more** about setting up a SPARQL endpoint](https://comunica.dev/docs/query/getting_started/setup_endpoint/)._
