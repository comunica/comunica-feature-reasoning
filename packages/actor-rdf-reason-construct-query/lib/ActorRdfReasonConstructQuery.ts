import { ActorRdfReason, ActorRdfReasonMediated, IActionRdfReason, IActorRdfReasonMediatedArgs, IActorRdfReasonOutput, IReason, IReasonOutput } from '@comunica/bus-rdf-reason';
import { IActorArgs, IActorTest } from '@comunica/core';
import { empty } from 'asynciterator'

/**
 * A comunica Construct Query Reasoner RDF Reason Actor.
 */
export class ActorRdfReasonConstructQuery extends ActorRdfReasonMediated {
  // public constructor(args: IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput>) {
  //   super(args);
  // }
  public constructor(args: IActorRdfReasonMediatedArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  // async reason(params: IReason): Promise<IReasonOutput> {
  //   return {
  //     updates: {
  //       implicit: {
  //         insert: empty(),
  //         delete: empty(),
  //       },
  //       explicit: {
  //         insert: empty(),
  //         delete: empty(),
  //       },
  //     }
  //   }
  // }
}
