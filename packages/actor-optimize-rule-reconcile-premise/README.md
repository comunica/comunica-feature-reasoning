# Comunica Reconcile Premise Optimize Rule Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-optimize-rule-reconcile-premise.svg)](https://www.npmjs.com/package/@comunica/actor-optimize-rule-reconcile-premise)

A comunica Actor that Optimizes rules by merging those rules that have a shared premise

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-optimize-rule-reconcile-premise
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-optimize-rule-reconcile-premise/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": TODO,
      "@type": "ActorOptimizeRuleReconcilePremise"
    }
  ]
}
```

### Config Parameters

TODO
