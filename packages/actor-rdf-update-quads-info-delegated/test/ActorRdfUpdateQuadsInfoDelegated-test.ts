import type {
  MediatorRdfFilterExistingQuads,
  IActionRdfFilterExistingQuads,
  IActorRdfFilterExistingQuadsOutput,
} from '@comunica/bus-rdf-filter-existing-quads';
import { getContextDestination } from '@comunica/bus-rdf-update-quads';
import type {
  MediatorRdfUpdateQuads,
  IActionRdfUpdateQuads,
  IActorRdfUpdateQuadsOutput,
} from '@comunica/bus-rdf-update-quads';
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import { empty } from 'asynciterator';
import { promisifyEventEmitter } from 'event-emitter-promisify';
import { Store } from 'n3';
import { ActorRdfUpdateQuadsInfoDelegated } from '../lib/ActorRdfUpdateQuadsInfoDelegated';

describe('ActorRdfUpdateQuadsInfoDelegated', () => {
  let bus: any;
  let destination: Store;
  let source: Store;
  let mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
  let mediatorRdfFilterExistingQuads: MediatorRdfFilterExistingQuads;
  let context: IActionContext;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsInfoDelegated instance', () => {
    let actor: ActorRdfUpdateQuadsInfoDelegated;

    beforeEach(() => {
      destination = new Store();

      context = new ActionContext({
        [KeysRdfUpdateQuads.destination.name]: destination,
      });

      // @ts-expect-error
      mediatorRdfUpdateQuads = {
        async mediate({ quadStreamInsert, context }: IActionRdfUpdateQuads): Promise<IActorRdfUpdateQuadsOutput> {
          return {
            async execute() {
              const dest: Store = getContextDestination(context) as Store;
              if (quadStreamInsert)
              { return promisifyEventEmitter(dest.import(quadStreamInsert)); }
            },
          };
        },
      };

      // @ts-expect-error
      mediatorRdfFilterExistingQuads = {
        async mediate(action: IActionRdfFilterExistingQuads): Promise<IActorRdfFilterExistingQuadsOutput> {
          return {
            async execute() {
              let quadStream = action.quadStream;
              const destination: Store | undefined = action.context.get(KeysRdfUpdateQuads.destination);
              const source: Store | undefined = action.context.get(KeysRdfResolveQuadPattern.source);
              const sources: Store[] | undefined = action.context.get(KeysRdfResolveQuadPattern.sources);

              // TODO: Remove the 3 '?' operators in this section, they should not be necessary since we are already checking
              // that things are not defined
              if (action.filterSource && (source || sources)) {
                if (source)
                { quadStream = quadStream.filter(quad => !source?.has(quad)); }
                else if (sources)
                { quadStream = quadStream.filter(quad => !sources?.some(src => src.has(quad))); }
              }

              if (action.filterDestination && destination) {
                quadStream = quadStream.filter(quad => !destination?.has(quad));
              }

              return {
                quadStream,
              };
            },
          };
        },
      };

      actor = new ActorRdfUpdateQuadsInfoDelegated({
        name: 'actor',
        bus,
        mediatorRdfUpdateQuads,
        mediatorRdfFilterExistingQuads,
      });
    });

    it('should test', () => {
      expect(actor.test({ context, filterSource: true })).resolves.toEqual(true);
      expect(actor.test({ context, filterSource: false })).resolves.toEqual(true);
    });

    it('Should error on non insertion operations', () => {
      expect(actor.test({ context, filterSource: false, quadStreamDelete: empty() })).rejects.toThrow();
      expect(actor.test({
        context,
        filterSource: false,
        deleteGraphs: { graphs: [], requireExistence: true, dropGraphs: true },
      })).rejects.toThrow();
    });

    it('should run', () => {
      // Return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
