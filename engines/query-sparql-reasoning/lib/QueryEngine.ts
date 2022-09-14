import { QueryEngineBase } from '@comunica/actor-init-query';
import type { ActorInitQueryBase } from '@comunica/actor-init-query';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';

const engineDefault = require('../engine-default.js');
// TODO: Clean up when https://github.com/comunica/comunica/issues/949 is released
engineDefault.contextKeyShortcuts.rules = KeysRdfReason.rules.name;
engineDefault.contextKeyShortcuts.implicitDatasetFactory = KeysRdfReason.implicitDatasetFactory.name;

/**
 * A Comunica SPARQL query engine.
 */
export class QueryEngine extends QueryEngineBase {
  public constructor(engine: ActorInitQueryBase = engineDefault) {
    super(engine);
  }
}
