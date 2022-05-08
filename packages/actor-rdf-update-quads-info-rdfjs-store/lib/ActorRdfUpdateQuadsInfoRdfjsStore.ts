import { FederatedQuadSource } from '@comunica/actor-rdf-resolve-quad-pattern-federated';
import { getContextDestination } from '@comunica/bus-rdf-update-quads';
import { ActorRdfUpdateQuadsInfo, IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoArgs, IActorRdfUpdateQuadsInfoOutput } from '@comunica/bus-rdf-update-quads-info';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { IActorTest } from '@comunica/core';
import { IDataSource } from '@comunica/types';
import { DatasetCore } from '@rdfjs/types';

// TODO: Refactor common logic with n3 store into an abstract class
// TODO: Double check name casing

/**
 * A comunica RDFjs Store RDF Update Quads Info Actor.
 */
 export class ActorRdfUpdateQuadsInfoRdfjsStore extends ActorRdfUpdateQuadsInfo {
  public constructor(args: IActorRdfUpdateQuadsInfoArgs) {
    super(args);
  }

  public async test(action: IActionRdfUpdateQuadsInfo): Promise<IActorTest> {
    if (action.context.has(KeysRdfResolveQuadPattern.source) || action.context.has(KeysRdfResolveQuadPattern.sources))
      throw new Error('The N3 store rdf-update-quads-info actor cannot run if there are source(s) defined')
    const destination: DatasetCore | undefined = getContextDestination(action.context) as unknown as DatasetCore;
    if (!destination) {
      throw new Error('There is no destination defined')
    }
    if (typeof destination.add !== 'function' || typeof destination.has !== 'function') {
      throw new Error('This actor only works on RDFJS Dataset Cores')
    }
    if (action.quadStreamDelete || action.createGraphs || action.deleteGraphs) {
      throw new Error('Only QuadStreamInsert is implemented on this actor');
    }
    if (action.filterSource)
      throw new Error('Cannot filter source');

    return true;
  }


  public async run({ quadStreamInsert, context }: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
    return {
      async execute() {
        if (quadStreamInsert) {
          const store: DatasetCore = getContextDestination(context) as unknown as DatasetCore;
          const sourceIds: Map<IDataSource, string> | undefined = context.get(KeysRdfResolveQuadPattern.sourceIds);
          const id = sourceIds?.get(store as any);

          if (id === undefined) {
            quadStreamInsert = quadStreamInsert.filter(quad => !store.has(quad) && (store.add(quad), true));
          } else {
            quadStreamInsert = quadStreamInsert.filter(quad => {
              quad = FederatedQuadSource.deskolemizeQuad(quad, id);
              return !store.has(quad) && (store.add(quad), true);
            });
          }
        }

        // TODO: Remove type casting when https://github.com/rdfjs/N3.js/issues/276 is resolved
        return { quadStreamInsert }
      }
    }
  }
}
