import { Bus } from '@comunica/core';
import { ActorRdfUpdateQuadsInfoDelegated } from '../lib/ActorRdfUpdateQuadsInfoDelegated';
import { MediatorRdfUpdateQuads, IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput } from '@comunica/bus-rdf-update-quads';
import { MediatorRdfFilterExistingQuads, IActionRdfFilterExistingQuads, IActorRdfFilterExistingQuadsOutput } from '@comunica/bus-rdf-filter-existing-quads';
import { Store } from 'n3';
import { promisifyEventEmitter } from 'event-emitter-promisify';
import {} from '@comunica/bus-rdf-filter-existing-quads'
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { IActionContext } from '@comunica/types';

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

      // @ts-ignore
      mediatorRdfUpdateQuads = {
        async mediate(action: IActionRdfUpdateQuads): Promise<IActorRdfUpdateQuadsOutput> {
          return {
            async execute() {
              return promisifyEventEmitter(destination.import(action.quadStreamInsert));
            }
          }
        }
      }

      // @ts-ignore
      mediatorFilterExistingQuads = {
        async mediate(action: IActionRdfFilterExistingQuads): Promise<IActorRdfFilterExistingQuadsOutput> {
          return {
            async execute() {
              let quadStream = action.quadStream;
              let destination: Store | undefined = action.context.get(KeysRdfUpdateQuads.destination);
              let source: Store | undefined = action.context.get(KeysRdfResolveQuadPattern.source);
              let sources: Store[] | undefined = action.context.get(KeysRdfResolveQuadPattern.sources);

              if (action.filterSource && (source || sources)) {
                if (source)
                  quadStream = quadStream.filter(quad => !source.has(quad));
                else if (sources)
                  quadStream = quadStream.filter(quad => !sources.some(source => source.has(quad)));
              }

              if (action.filterDestination && destination) {
                quadStream = quadStream.filter(quad => !destination.has(quad));
              }

              return {
                quadStream
              }
            }
          }
        }
      }

      actor = new ActorRdfUpdateQuadsInfoDelegated({
        name: 'actor',
        bus,
        mediatorRdfUpdateQuads,
        mediatorRdfFilterExistingQuads
      });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
