import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput, IActorRdfReasonArgs } from '@comunica/bus-rdf-reason';
import { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica Eye RDF Reason Actor.
 */
export class ActorRdfReasonEye extends ActorRdfReason {
  public constructor(args: IActorRdfReasonArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    return true; // TODO implement
  }
}
