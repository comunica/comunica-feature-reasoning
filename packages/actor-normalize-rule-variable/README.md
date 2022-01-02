# Comunica Variable Normalize Rule Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-normalize-rule-variable.svg)](https://www.npmjs.com/package/@comunica/actor-normalize-rule-variable)

A comunica actor that normalizes variables in rules

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-normalize-rule-variable
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-normalize-rule-variable/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": TODO,
      "@type": "ActorNormalizeRuleVariable"
    }
  ]
}
```

### Config Parameters

TODO
