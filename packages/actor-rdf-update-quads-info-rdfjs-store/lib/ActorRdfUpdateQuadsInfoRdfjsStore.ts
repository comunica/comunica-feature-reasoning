import { ActorRdfUpdateQuadsInfo, IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoOutput } from '@comunica/bus-rdf-update-quads-info';
import { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica RDFjs Store RDF Update Quads Info Actor.
 */
export class ActorRdfUpdateQuadsInfoRdfjsStore extends ActorRdfUpdateQuadsInfo {
  public constructor(args: IActorArgs<IActionRdfUpdateQuadsInfo, IActorTest, IActorRdfUpdateQuadsInfoOutput>) {
    super(args);
  }

  public async test(action: IActionRdfUpdateQuadsInfo): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
    return true; // TODO implement
  }
}
