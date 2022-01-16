import { ActorRdfUpdateQuadsIntercept, IActionRdfUpdateQuadsIntercept, IActorRdfUpdateQuadsInterceptOutput } from '@comunica/bus-rdf-update-quads-intercept';
import { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica Reasoned RDF Update Quads Intercept Actor.
 */
export class ActorRdfUpdateQuadsInterceptReasoned extends ActorRdfUpdateQuadsIntercept {
  public constructor(args: IActorArgs<IActionRdfUpdateQuadsIntercept, IActorTest, IActorRdfUpdateQuadsInterceptOutput>) {
    super(args);
  }

  public async test(action: IActionRdfUpdateQuadsIntercept): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfUpdateQuadsIntercept): Promise<IActorRdfUpdateQuadsInterceptOutput> {
    return true; // TODO implement
  }
}
