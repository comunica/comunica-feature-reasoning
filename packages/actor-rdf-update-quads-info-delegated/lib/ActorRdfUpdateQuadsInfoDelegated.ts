import { MediatorRdfFilterExistingQuads } from '@comunica/bus-rdf-filter-existing-quads';
import { ActorRdfUpdateQuadsInfo, IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoArgs, IActorRdfUpdateQuadsInfoOutput } from '@comunica/bus-rdf-update-quads-info';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { IActorTest } from '@comunica/core';
import { MediatorRdfUpdateQuads, getContextDestination } from '@comunica/bus-rdf-update-quads'
import { hasContextSingleSource, getContextSource, getContextSources } from '@comunica/bus-rdf-resolve-quad-pattern';
import { IActionContext } from '@comunica/types';

/**
 * @param context The original context
 * @returns The context of the sources that *actually* need to be filtered (excluding the destination) - returns false
 * if no sources need to be filtered
 */
function preprocess(context: IActionContext): IActionContext | false {
  const destination = getContextDestination(context);
  
  if (hasContextSingleSource(context)) {
    const source = getContextSource(context)
    // TODO: Do better equality to check handling the fact that one could be in an object and the other may not
    // If the source is equal to the destination then we do not need to filter the source first
    if (source === destination) {
      return false;
    }
    return context;
  }

  const sources = getContextSources(context)?.filter(source => source !== destination);
  
  // Should also do a better equality check here
  if (!sources || sources.length === 0) {
    return false;
  }

  // TODO: Optimize by only setting when sources have changed to avoid unecessary context creation
  return context.set(KeysRdfResolveQuadPattern.sources, sources);
}

/**
 * A comunica Delegated RDF Update Quads Info Actor.
 */
export class ActorRdfUpdateQuadsInfoDelegated extends ActorRdfUpdateQuadsInfo {
  mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
  mediatorRdfFilterExistingQuads: MediatorRdfFilterExistingQuads;

  public constructor(args: IActorRdfUpdateQuadsInfoDelegatedArgs) {
    super(args);
  }

  public async test(action: IActionRdfUpdateQuadsInfo): Promise<IActorTest> {
    // Tests around sources and destinations
    if (!action.context.has(KeysRdfUpdateQuads.destination))
      throw new Error('A destination is required')

    // TODO: We can probably get rid of this condition
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
        // TODO [Future, Optimization]: Filter out the destination from the soure/sources before passing to 
        const context = preprocess(action.context);

        // TODO: Handle deskomisation (this is probably a job for the filtering actor anyway)
        const quadStreamInsert = (await (await this.mediatorRdfFilterExistingQuads.mediate({ filterSource: action.filterSource && context !== false, filterDestination: true, quadStream: action.quadStreamInsert, context: context || action.context })).execute()).quadStream;

          // Need to be very careful here because we are inserting more-or-less at same time as we are deleting (though if we are not could be equally as bad due to duplicates appearing in the stream)
        await (await this.mediatorRdfUpdateQuads.mediate({ ...action, quadStreamInsert: quadStreamInsert.clone(), context: action.context.delete(KeysRdfResolveQuadPattern.source).delete(KeysRdfResolveQuadPattern.sources) })).execute();
        return { quadStreamInsert: quadStreamInsert.clone() }
      }
    }
  }
}

export interface IActorRdfUpdateQuadsInfoDelegatedArgs extends IActorRdfUpdateQuadsInfoArgs {
  mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
  mediatorRdfFilterExistingQuads: MediatorRdfFilterExistingQuads;
}
