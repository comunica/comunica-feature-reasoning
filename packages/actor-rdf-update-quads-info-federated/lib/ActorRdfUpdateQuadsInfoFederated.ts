import { ActorRdfUpdateQuadsInfo, IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoOutput, IActorRdfUpdateQuadsInfoArgs, MediatorRdfUpdateQuadsInfo } from '@comunica/bus-rdf-update-quads-info';
import { IActorArgs, IActorTest } from '@comunica/core';
import {} from '@comunica/bus-rdf-update-quads-info';
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { MediatorRdfFilterExistingQuads } from '@comunica/bus-rdf-filter-existing-quads';

/**
 * A comunica Federated RDF Update Quads Info Actor.
 */
export class ActorRdfUpdateQuadsInfoFederated extends ActorRdfUpdateQuadsInfo {
  public readonly mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;
  public readonly mediatorFilterExistingQuads: MediatorRdfFilterExistingQuads;

  public constructor(args: IActorArgs<IActionRdfUpdateQuadsInfo, IActorTest, IActorRdfUpdateQuadsInfoOutput>) {
    super(args);
  }

  public async test(action: IActionRdfUpdateQuadsInfo): Promise<IActorTest> {
    // Tests around sources and destinations
    if (!action.context.has(KeysRdfUpdateQuads.destination))
      throw new Error('A destination is required')
    if (!action.context.has(KeysRdfResolveQuadPattern.source) && !action.context.has(KeysRdfResolveQuadPattern.source))
      throw new Error('A source or source(s) are required')

    // Tests around what has currently been implemented
    if (action.createGraphs || action.deleteGraphs || action.quadStreamDelete)
      throw new Error('Currently only quadStreamInsert is supported');
    return true;
  }

  public async run(action: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
    return {
      execute: async() => {
        let { quadStreamInsert } = await (await this.mediatorRdfUpdateQuadsInfo.mediate({ ...action, context: action.context.delete(KeysRdfResolveQuadPattern.source).delete(KeysRdfResolveQuadPattern.sources) })).execute();

        // Filter the quad stream if ignoreSourceComparison is disabled
        if (quadStreamInsert && !action.ignoreSourceComparison) {
          quadStreamInsert = (await (await this.mediatorFilterExistingQuads.mediate({ filterSource: true, filterDestination: false, context: action.context, quadStream: quadStreamInsert })).execute()).quadStream;
        }

        // Return the resultant quad stream
        return { quadStreamInsert }
      }
    }
  }
}

export interface IActorRdfUpdateQuadsInfoFederatedArgs extends IActorRdfUpdateQuadsInfoArgs {
  mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;
  mediatorFilterExistingQuads: MediatorRdfFilterExistingQuads;
}
