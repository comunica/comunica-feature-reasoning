# Comunica SPARQL File Reasoning Init Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Fquery-sparql-file-reasoning.svg)](https://www.npmjs.com/package/@comunica/query-sparql-file-reasoning)
<!-- [![Docker Pulls](https://img.shields.io/docker/pulls/comunica/query-sparql-link-traversal.svg)](https://hub.docker.com/r/comunica/query-sparql-link-traversal/) -->

Comunica is a SPARQL query engine for JavaScript that - this build of the engine, allows data to be enriched with reasoning results.

This module is part of the [Comunica framework](https://comunica.dev/).

## Install

```bash
$ yarn add @comunica/query-sparql-file-reasoning
```

or

```bash
$ npm install -g @comunica/query-sparql-file-reasoning
```

## Install a prerelease

Since this package is still in testing phase, you may want to install a prerelease of this package, which you can do by appending `@next` to the package name during installation.

```bash
$ yarn add @comunica/query-sparql-file-reasoning@next
```

or

```bash
$ npm install -g @comunica/query-sparql-file-reasoning@next
```

## Usage

To query over a profile and the foaf ontology:

```bash
$ comunica-sparql-file-reasoning https://www.rubensworks.net/ \
  http://xmlns.com/foaf/spec/index.rdf \
  -q 'SELECT * WHERE { <https://www.rubensworks.net/#me> a ?o }' \
  -r rdfs
```

By default, RDFS reasoning is applied if no rules are specified. Alternatively you can specify `owl2rl` or provide a dereferencable link to another rule source.

Show the help with all options:

```bash
$ comunica-sparql-file-reasoning --help
```

Just like [Comunica SPARQL](https://github.com/comunica/comunica/tree/master/packages/query-sparql),
a [dynamic variant](https://github.com/comunica/comunica/tree/master/packages/query-sparql#usage-from-the-command-line) (`comunica-dynamic-sparql-file-reasoning`) also exists.

_[**Read more** about querying from the command line](https://comunica.dev/docs/query/getting_started/query_cli/)._

### Usage within application

This engine can be used in JavaScript/TypeScript applications as follows:

```javascript
const QueryEngine = require('@comunica/query-sparql-link-traversal').QueryEngine;
const myEngine = new QueryEngine();
import { KeysRdfDereferenceConstantHylar } from '@comunica/reasoning-context-entries';

const bindingsStream = await myEngine.queryBindings(`
  SELECT * WHERE { <https://www.rubensworks.net/#me> a ?o }`, {
    sources: [
      'https://www.rubensworks.net/',
      'http://xmlns.com/foaf/spec/index.rdf'
    ],
    rules: KeysRdfDereferenceConstantHylar.rdfs,
});

// Consume results as a stream (best performance)
bindingsStream.on('data', (binding) => {
    console.log(binding.toString()); // Quick way to print bindings for testing

    console.log(binding.has('o')); // Will be true

    // Obtaining values
    console.log(binding.get('o').value);
});
bindingsStream.on('end', () => {
    // The data-listener will not be called anymore once we get here.
});
bindingsStream.on('error', (error) => {
    console.error(error);
});

// Consume results as an array (easier)
const bindings = await bindingsStream.toArray();
console.log(bindings[0].get('o').value);
console.log(bindings[0].get('o').termType);
```

_[**Read more** about querying an application](https://comunica.dev/docs/query/getting_started/query_app/)._

### Usage as a SPARQL endpoint

Start a webservice exposing https://www.rubensworks.net/ via the SPARQL protocol, i.e., a _SPARQL endpoint_.

```bash
$ comunica-sparql-file-reasoning-http https://www.rubensworks.net/ http://xmlns.com/foaf/spec/index.rdf
```

Show the help with all options:

```bash
$ comunica-sparql-file-reasoning --help
```

The SPARQL endpoint can only be started dynamically.
An alternative config file can be passed via the `COMUNICA_CONFIG` environment variable.

Use `bin/http.js` when running in the Comunica monorepo development environment.

_[**Read more** about setting up a SPARQL endpoint](https://comunica.dev/docs/query/getting_started/setup_endpoint/)._
