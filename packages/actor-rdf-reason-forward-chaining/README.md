# Comunica Forward Chaining RDF Reason Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rdf-reason-forward-chaining.svg)](https://www.npmjs.com/package/@comunica/actor-rdf-reason-forward-chaining)

A comunica Forward Chaining RDF Reason Actor.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rdf-reason-forward-chaining
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rdf-reason-forward-chaining/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": "urn:comunica:default:rdf-reason/actors#forward-chaining",
      "@type": "ActorRdfReasonForwardChaining"
    }
  ]
}
```

### Config Parameters

TODO: fill in parameters (this section can be removed if there are none)

* `someParam`: Description of the param
