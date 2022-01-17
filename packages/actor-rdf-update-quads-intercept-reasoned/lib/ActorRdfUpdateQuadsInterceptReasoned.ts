import { getContextWithImplicitDataset, MediatorRdfReason, setContextReasoning, setImplicitDestination, setImplicitSource, setUnionSource } from '@comunica/bus-rdf-reason';
import { ActorRdfUpdateQuadsIntercept, IActionRdfUpdateQuadsIntercept, IActorRdfUpdateQuadsInterceptOutput, IActorRdfUpdateQuadsInterceptArgs } from '@comunica/bus-rdf-update-quads-intercept';
import { IActorArgs, IActorTest } from '@comunica/core';

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
    const { updateResult } = await this.mediatorRdfUpdateQuads.mediate({
      createGraphs: action.createGraphs,
      deleteGraphs: action.deleteGraphs,
      context: setImplicitSource(setImplicitDestination(context)),
    });

    // await updateResult;

    // TODO: Implement properly  
    // const context = getContextWithImplicitDataset(action.context);
    // TODO: Work out how to emit results from other sources while still reasoning
    // const { updateResult } = await this.mediatorRdfUpdateQuads.mediate(action);
    // await updateResult
    // TODO: Re-implement this so that we do it in *parallel* with the updates
    const { reasoned } = await this.mediatorRdfReason.mediate({ context: action.context, updates: {
      quadStreamDelete: action.quadStreamDelete,
      quadStreamInsert: action.quadStreamInsert,
    } });

    // await reasoned;

    return { ...action, context: setContextReasoning(context, Promise.all([updateResult, reasoned])) };
  }
}

interface IActorRdfUpdateQuadsInterceptReasonedArgs extends IActorRdfUpdateQuadsInterceptArgs {
  mediatorRdfReason: MediatorRdfReason;
}
