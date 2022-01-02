# Comunica Pattern Restriction Optimize Rule Data Aware Actor

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-optimize-rule-data-aware-pattern-restriction.svg)](https://www.npmjs.com/package/@comunica/actor-optimize-rule-data-aware-pattern-restriction)

A comunica actor that restricts rules based on whether appropriate premise patterns are available

This module is part of the [Comunica framework](https://github.com/comunica/comunica),
and should only be used by [developers that want to build their own query engine](https://comunica.dev/docs/modify/).

[Click here if you just want to query with Comunica](https://comunica.dev/docs/query/).

## Install

```bash
$ yarn add @comunica/actor-optimize-rule-data-aware-pattern-restriction
```

## Configure

After installing, this package can be added to your engine's configuration as follows:
```text
{
  "@context": [
    ...
    "https://linkedsoftwaredependencies.org/bundles/npm/@comunica/actor-optimize-rule-data-aware-pattern-restriction/^1.0.0/components/context.jsonld"  
  ],
  "actors": [
    ...
    {
      "@id": TODO,
      "@type": "ActorOptimizeRuleDataAwarePatternRestriction"
    }
  ]
}
```

### Config Parameters

TODO
