import { ActorRdfUpdateQuadsInfo, IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoOutput, IActorRdfUpdateQuadsInfoArgs } from '@comunica/bus-rdf-update-quads-info';
import { IActorArgs, IActorTest } from '@comunica/core';
import { AsyncIterator } from 'asynciterator';
import * as RDF from '@rdfjs/types';
import { IActionRdfUpdateQuads, } from '@comunica/bus-rdf-update-quads';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { FederatedQuadSource } from '@comunica/actor-rdf-resolve-quad-pattern-federated'
import { getContextDestination } from '@comunica/bus-rdf-update-quads';
import { Store } from 'n3';

// TODO: Remove these once https://github.com/comunica/comunica/pull/974 is merged
export function deskolemizeStream(stream: AsyncIterator<RDF.Quad> | undefined, id: string):
AsyncIterator<RDF.Quad> | undefined {
  return stream?.map(quad => FederatedQuadSource.deskolemizeQuad(quad, id));
}

export function deskolemize(action: IActionRdfUpdateQuads): IActionRdfUpdateQuads {
  const destination = action.context.get(KeysRdfUpdateQuads.destination);
  const id = action.context.get<Map<any, string>>(KeysRdfResolveQuadPattern.sourceIds)?.get(destination);
  if (!id) {
    return action;
  }
  return {
    ...action,
    quadStreamInsert: deskolemizeStream(action.quadStreamInsert, id),
    quadStreamDelete: deskolemizeStream(action.quadStreamDelete, id),
  };
}

/**
 * A comunica N3 Store RDF Update Quads Info Actor.
 * 
 * The only reason this actor exists is because it is twice as fast to use addQuad than to a has check followed by
 * an add.
 */
export class ActorRdfUpdateQuadsInfoN3Store extends ActorRdfUpdateQuadsInfo {
  public constructor(args: IActorRdfUpdateQuadsInfoArgs) {
    super(args);
  }

  public async test(action: IActionRdfUpdateQuadsInfo): Promise<IActorTest> {
    if (action.context.has(KeysRdfResolveQuadPattern.source) || action.context.has(KeysRdfResolveQuadPattern.sources))
      throw new Error('The N3 store rdf-update-quads-info actor cannot run if there are source(s) defined')
    const destination = getContextDestination(action.context);
    if (!destination) {
      throw new Error('There is no destination defined')
    }
    if (!(destination instanceof Store)) {
      throw new Error('This actor only works on the n3 implementation of RDFJS stores')
    }
    if (action.quadStreamDelete || action.createGraphs || action.deleteGraphs) {
      throw new Error('Only QuadStreamInsert is implemented on this actor');
    }
    return true;
  }

  
  public async run(action: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
    const store: Store = getContextDestination(action.context) as Store;
    return {
      async execute() {
        return {
          // TODO: Remove type casting when https://github.com/rdfjs/N3.js/issues/276 is resolved
          quadStreamInsert: action.quadStreamInsert?.filter(quad => store.addQuad(quad) as unknown as boolean)
        }
      }
    }
  }
}
