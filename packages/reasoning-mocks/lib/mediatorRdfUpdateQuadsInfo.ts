import { getContextSource, getContextSources, hasContextSingleSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import { IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoOutput } from '@comunica/bus-rdf-update-quads-info';
import { KeysRdfUpdateQuads } from '@comunica/context-entries';
import { DataFactory, Store } from 'n3';

export const mediatorRdfUpdateQuadsInfo = <any> {
  async mediate(action: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
    return {
      execute: async () => {
        const dest: Store = action.context.getSafe<Store>(KeysRdfUpdateQuads.destination);
        // TODO: Remove type casting once https://github.com/rdfjs/N3.js/issues/286 is merged
        let quadStreamInsert = action.quadStreamInsert?.filter(quad => dest.addQuad(quad) as unknown as boolean);

        if (action.filterSource) {
          if (hasContextSingleSource(action.context)) {
            const source: Store = getContextSource(action.context) as Store;
            quadStreamInsert = quadStreamInsert?.filter(quad => !source.has(quad));
          } else {
            const sources = getContextSources(action.context) as Store[];
            quadStreamInsert = quadStreamInsert?.filter(quad => sources.every(store => !store.has(quad)));
          }
          
        }

        return { quadStreamInsert };
      }
    }
  }
}