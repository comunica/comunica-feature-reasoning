import { ActorRdfFilterExistingQuads, IActionRdfFilterExistingQuads, IActorRdfFilterExistingQuadsOutput } from '@comunica/bus-rdf-filter-existing-quads';
import { getContextDestination } from '@comunica/bus-rdf-update-quads';
import { IActorArgs, IActorTest } from '@comunica/core';
import { Store } from 'n3';

/**
 * A comunica RDFjs Source RDF Filter Existing Quads Actor.
 */
export class ActorRdfFilterExistingQuadsRdfjsSource extends ActorRdfFilterExistingQuads {
  public constructor(args: IActorArgs<IActionRdfFilterExistingQuads, IActorTest, IActorRdfFilterExistingQuadsOutput>) {
    super(args);
  }

  public async test(action: IActionRdfFilterExistingQuads): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfFilterExistingQuads): Promise<IActorRdfFilterExistingQuadsOutput> {
    const store: Store = getContextDestination(action.context) as Store;
    return {
      async execute() {
        return {
          quadStream: action.quadStream.filter(quad => !store.has(quad))
        }
      }
    }
  }
}
