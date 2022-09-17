import type { IActionRdfFilterExistingQuads,
  IActorRdfFilterExistingQuadsOutput } from '@comunica/bus-rdf-filter-existing-quads';
import {
  ActorRdfFilterExistingQuads,
} from '@comunica/bus-rdf-filter-existing-quads';
import { hasContextSingleSourceOfType, getContextSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import type { IActorArgs, IActorTest } from '@comunica/core';
// import type { Store } from 'n3';
import * as RDF from '@rdfjs/types';

/**
 * A comunica RDFjs Source RDF Filter Existing Quads Actor.
 */
export class ActorRdfFilterExistingQuadsRdfjsSource extends ActorRdfFilterExistingQuads {
  public constructor(args: IActorArgs<IActionRdfFilterExistingQuads, IActorTest, IActorRdfFilterExistingQuadsOutput>) {
    super(args);
  }

  // TODO: Get this working properly by adding the checks in
  // https://github.com/comunica/comunica/blob/146b41da2135033be72a6342ecf2313b381daff9/packages
  // /actor-rdf-update-quads-rdfjs-store/lib/ActorRdfUpdateQuadsRdfJsStore.ts#L19
  public async test(action: IActionRdfFilterExistingQuads): Promise<IActorTest> {
    if (action.filterDestination) {
      throw new Error(`${this.name} does not handle filtering destinations`);
    }

    if (!action.filterSource) {
      throw new Error(`${this.name} expects filterSource to be true`);
    }

    if (!hasContextSingleSourceOfType('rdfjsSource', action.context)) {
      throw new Error(`${this.name} expects a single source of type rdfjsSource`);
    }

    return true;
  }

  public async run(action: IActionRdfFilterExistingQuads): Promise<IActorRdfFilterExistingQuadsOutput> {
    return {
      async execute() {
        const store: RDF.DatasetCore = <RDF.DatasetCore> <unknown> getContextSource(action.context);
        return {
          quadStream: action.quadStream.filter(quad => !store.has(quad)),
        };
      },
    };
  }
}
