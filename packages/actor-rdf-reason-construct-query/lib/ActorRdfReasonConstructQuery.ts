import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput } from '@comunica/bus-rdf-reason';
import { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica Construct Query Reasoner RDF Reason Actor.
 */
export class ActorRdfReasonConstructQuery extends ActorRdfReason {
  public constructor(args: IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput>) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    return true; // TODO implement
  }

  reason() {}
}
