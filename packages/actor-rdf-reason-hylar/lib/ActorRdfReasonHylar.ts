import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput } from '@comunica/bus-rdf-reason';
import { IActorArgs, IActorTest } from '@comunica/core';
import { incremental, factsToQuads, quadsToFacts } from 'hylar-core';

/**
 * A comunica Hylar Reasoner RDF Reason Actor.
 */
export class ActorRdfReasonHylar extends ActorRdfReason {
  public constructor(args: IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput>) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    action.context?.asImmutable
    return true; // TODO implement
  }

  reason() {}
}
