import { MediatorRdfFilterExistingQuads } from '@comunica/bus-rdf-filter-existing-quads';
import { ActorRdfUpdateQuadsInfo, IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoArgs, IActorRdfUpdateQuadsInfoOutput, MediatorRdfUpdateQuadsInfo } from '@comunica/bus-rdf-update-quads-info';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { IActorArgs, IActorTest } from '@comunica/core';
import { MediatorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads'



/**
 * A comunica Delegated RDF Update Quads Info Actor.
 */
export class ActorRdfUpdateQuadsInfoDelegated extends ActorRdfUpdateQuadsInfo {
  mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
  mediatorFilterExistingQuads: MediatorRdfFilterExistingQuads;

  public constructor(args: IActorRdfUpdateQuadsInfoDelegatedArgs) {
    super(args);
  }

  public async test(action: IActionRdfUpdateQuadsInfo): Promise<IActorTest> {
    // Tests around sources and destinations
    if (!action.context.has(KeysRdfUpdateQuads.destination))
      throw new Error('A destination is required')
    if (action.context.has(KeysRdfResolveQuadPattern.source) || action.context.has(KeysRdfResolveQuadPattern.source))
      throw new Error('A source or source(s) are not allowed')

    // Tests around what has currently been implemented
    if (action.createGraphs || action.deleteGraphs || action.quadStreamDelete)
      throw new Error('Currently only quadStreamInsert is supported');
    return true;
  }

  public async run(action: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
    return {
      execute: async() => {
        if (!action.quadStreamInsert)
          return {}
        // TODO: Handle deskomisation
        const quadStreamInsert = (await (await this.mediatorFilterExistingQuads.mediate({ filterSource: false, filterDestination: true, context: action.context, quadStream: action.quadStreamInsert })).execute()).quadStream;
        // Need to be very careful here because we are inserting more-or-less at same time as we are deleting (though if we are not could be equally as bad due to duplicates appearing in the stream)
        await (await this.mediatorRdfUpdateQuads.mediate({ ...action, quadStreamInsert: quadStreamInsert.clone(), context: action.context.delete(KeysRdfResolveQuadPattern.source).delete(KeysRdfResolveQuadPattern.sources) })).execute();
        return { quadStreamInsert: quadStreamInsert.clone() }
      }
    }
  }
}

export interface IActorRdfUpdateQuadsInfoDelegatedArgs extends IActorRdfUpdateQuadsInfoArgs {
  mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
  mediatorFilterExistingQuads: MediatorRdfFilterExistingQuads;
}
