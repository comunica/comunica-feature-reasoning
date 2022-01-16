import { ActorRdfUpdateQuadsIntercept, IActionRdfUpdateQuadsIntercept, IActorRdfUpdateQuadsInterceptOutput, IActorRdfUpdateQuadsInterceptArgs } from '@comunica/bus-rdf-update-quads-intercept';
import { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica Reasoned RDF Update Quads Intercept Actor.
 */
export class ActorRdfUpdateQuadsInterceptReasoned extends ActorRdfUpdateQuadsIntercept {
  public constructor(args: IActorRdfUpdateQuadsInterceptArgs) {
    super(args);
  }

  public async runIntercept(action: IActionRdfUpdateQuadsIntercept): Promise<IActionRdfUpdateQuadsIntercept> {
    // TODO: Implement properly  
    return action;
  }
}
