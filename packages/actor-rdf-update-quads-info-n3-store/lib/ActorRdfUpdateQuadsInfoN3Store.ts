import { FederatedQuadSource } from '@comunica/actor-rdf-resolve-quad-pattern-federated';
import { getContextDestination } from '@comunica/bus-rdf-update-quads';
import type {
  IActionRdfUpdateQuadsInfo,
  IActorRdfUpdateQuadsInfoArgs,
  IActorRdfUpdateQuadsInfoOutput,
} from '@comunica/bus-rdf-update-quads-info';
import { ActorRdfUpdateQuadsInfo } from '@comunica/bus-rdf-update-quads-info';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { IActorTest } from '@comunica/core';
import type { IDataSource } from '@comunica/types';
import { Store } from 'n3';

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
    // TODO: See if this is needed
    // if (action.context.has(KeysRdfResolveQuadPattern.source)
    // || action.context.has(KeysRdfResolveQuadPattern.sources))
    //   throw new Error('The N3 store rdf-update-quads-info actor cannot run if there are source(s) defined')

    const destination = getContextDestination(action.context);
    if (!destination) {
      throw new Error('There is no destination defined');
    }
    if (!(destination instanceof Store)) {
      throw new Error('This actor only works on the n3 implementation of RDFJS stores');
    }
    if (action.quadStreamDelete || action.createGraphs || action.deleteGraphs) {
      throw new Error('Only QuadStreamInsert is implemented on this actor');
    }
    if (action.filterSource) {
      throw new Error('Cannot filter source');
    }

    return true;
  }

  public async run({ quadStreamInsert, context }: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
    return {
      async execute() {
        if (quadStreamInsert) {
          const store: Store = <Store> getContextDestination(context);
          const sourceIds: Map<IDataSource, string> | undefined = context.get(KeysRdfResolveQuadPattern.sourceIds);
          const id = sourceIds?.get(store);

          if (id === undefined) {
            quadStreamInsert = quadStreamInsert.filter(quad => <boolean> <unknown> store.addQuad(quad));
          } else {
            quadStreamInsert = quadStreamInsert.filter(
              quad => <boolean> <unknown> store.addQuad(FederatedQuadSource.deskolemizeQuad(quad, id)),
            );
          }
        }

        // TODO: Remove type casting when https://github.com/rdfjs/N3.js/issues/276 is resolved
        return { quadStreamInsert };
      },
    };
  }
}
