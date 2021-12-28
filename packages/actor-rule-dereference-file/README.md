# Comunica File Rule Dereference Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-rule-dereference-file.svg)](https://www.npmjs.com/package/@comunica/actor-rule-dereference-file)

A comunica Actor for dereferencing file paths into streams of Rules

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-rule-dereference-file
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-rule-dereference-file/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": TODO,
      "@type": "ActorRuleDereferenceFile"
    }
  ]
}
```

### Config Parameters

TODO
