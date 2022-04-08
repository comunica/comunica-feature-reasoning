import { ActorRdfFilterExistingQuads, IActionRdfFilterExistingQuads, IActorRdfFilterExistingQuadsOutput } from '@comunica/bus-rdf-filter-existing-quads';
import { IActorArgs, IActorTest } from '@comunica/core';

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
    return true; // TODO implement
  }
}
