# Comunica Http Parse Rule Dereference Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rule-dereference-http-parse.svg)](https://www.npmjs.com/package/@comunica/actor-rule-dereference-http-parse)

An Rule Dereference actor implementation for Comunica that resolves the URL using the HTTP bus and parses it using the Rule parse bus.

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rule-dereference-http-parse
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rule-dereference-http-parse/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": TODO,
      "@type": "ActorRuleDereferenceHttpParse"
    }
  ]
}
```

### Config Parameters

TODO
