# Comunica Sparql Reasoning Init Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-init-sparql-reasoning.svg)](https://www.npmjs.com/package/@comunica/actor-init-sparql-reasoning)

A SPARQL query engine for querying over reasoned data

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-init-sparql-reasoning
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-init-sparql-reasoning/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": TODO,
      "@type": "ActorInitSparqlReasoning"
    }
  ]
}
```

### Config Parameters

TODO
