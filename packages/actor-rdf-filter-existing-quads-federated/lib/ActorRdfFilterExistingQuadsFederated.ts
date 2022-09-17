import type {
  IActionRdfFilterExistingQuads,
  IActorRdfFilterExistingQuadsOutput,
  IActorRdfFilterExistingQuadsArgs,
  MediatorRdfFilterExistingQuads,
} from '@comunica/bus-rdf-filter-existing-quads';
import { ActorRdfFilterExistingQuads } from '@comunica/bus-rdf-filter-existing-quads';
import { getContextSource, getContextSources, getDataSourceType, getDataSourceValue } from '@comunica/bus-rdf-resolve-quad-pattern';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { IActorTest } from '@comunica/core';

/**
 * A comunica Federated RDF Filter Existing Quads Actor.
 */
export class ActorRdfFilterExistingQuadsFederated extends ActorRdfFilterExistingQuads {
  public readonly mediatorRdfFilterExistingQuads: MediatorRdfFilterExistingQuads;

  public constructor(args: IActorRdfFilterExistingQuadsFederatedArgs) {
    super(args);
  }

  public async test(action: IActionRdfFilterExistingQuads): Promise<IActorTest> {
    if (!action.filterSource) {
      throw new Error('Expected filter source to be true');
    }

    if (action.filterDestination) {
      throw new Error('Expected filter destination to be false');
    }

    const sources = getContextSources(action.context);
    if (!sources) {
      throw new Error(`Actor ${this.name} can only filter quads against a sources array.`);
    }

    if (getContextSource(action.context)) {
      throw new Error(`Actor ${this.name} can only execute when no single source is present`)
    }

    return true;
  }

  public async run({ quadStream, context }: IActionRdfFilterExistingQuads):
  Promise<IActorRdfFilterExistingQuadsOutput> {
    return {
      execute: async() => {
        const sources = getContextSources(context)!
        context = context.delete(KeysRdfResolveQuadPattern.sources);

        for (const source of sources) {
          quadStream = (await (await this.mediatorRdfFilterExistingQuads.mediate({
            filterSource: true,
            filterDestination: false,
            // TODO: See if we need to handle deskolimzation, and reskolemization here
            quadStream,
            // From https://github.com/comunica/comunica/blob/fb76e4c44a886638ac066fd4db7bfd852eef7915/packages
            // /actor-rdf-resolve-quad-pattern-federated/lib/FederatedQuadSource.ts#L221-L224
            context: context.set(
              KeysRdfResolveQuadPattern.source,
              { type: getDataSourceType(source), value: getDataSourceValue(source) },
            ),
          })).execute()).quadStream;
        }

        return { quadStream };
      },
    };
  }
}

export interface IActorRdfFilterExistingQuadsFederatedArgs extends IActorRdfFilterExistingQuadsArgs {
  mediatorRdfFilterExistingQuads: MediatorRdfFilterExistingQuads;
}
