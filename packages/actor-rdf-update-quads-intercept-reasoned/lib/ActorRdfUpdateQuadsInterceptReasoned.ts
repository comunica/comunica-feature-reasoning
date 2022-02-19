import type { MediatorRdfReason } from '@comunica/bus-rdf-reason';
import { getContextWithImplicitDataset, setContextReasoning, setImplicitDestination, setImplicitSource } from '@comunica/bus-rdf-reason';
import type { IActionRdfUpdateQuadsIntercept, IActorRdfUpdateQuadsInterceptArgs } from '@comunica/bus-rdf-update-quads-intercept';
import { ActorRdfUpdateQuadsIntercept } from '@comunica/bus-rdf-update-quads-intercept';

/**
 * A comunica Reasoned RDF Update Quads Intercept Actor.
 */
export class ActorRdfUpdateQuadsInterceptReasoned extends ActorRdfUpdateQuadsIntercept {
  public readonly mediatorRdfReason: MediatorRdfReason;

  public constructor(args: IActorRdfUpdateQuadsInterceptReasonedArgs) {
    super(args);
  }

  public async runIntercept(action: IActionRdfUpdateQuadsIntercept): Promise<IActionRdfUpdateQuadsIntercept> {
    const context = getContextWithImplicitDataset(action.context);

    // First we handle changes to whole graphs
    // Note this only works so long as we are *not* doing inter-graph reasoning
    const { execute: executeUpdate } = await this.mediatorRdfUpdateQuads.mediate({
      createGraphs: action.createGraphs,
      deleteGraphs: action.deleteGraphs,
      context: setImplicitSource(setImplicitDestination(context)),
    });

    // Await updateResult;

    // TODO: Implement properly
    // const context = getContextWithImplicitDataset(action.context);
    // TODO: Work out how to emit results from other sources while still reasoning
    // const { updateResult } = await this.mediatorRdfUpdateQuads.mediate(action);
    // await updateResult
    // TODO: Re-implement this so that we do it in *parallel* with the updates
    const { execute: executeReasoning } = await this.mediatorRdfReason.mediate({ context: action.context,
      updates: {
        quadStreamDelete: action.quadStreamDelete,
        quadStreamInsert: action.quadStreamInsert,
      }});

    // Await reasoned;

    return { ...action, context: setContextReasoning(context, Promise.all([ executeUpdate(), executeReasoning() ])) };
  }
}

interface IActorRdfUpdateQuadsInterceptReasonedArgs extends IActorRdfUpdateQuadsInterceptArgs {
  mediatorRdfReason: MediatorRdfReason;
}
