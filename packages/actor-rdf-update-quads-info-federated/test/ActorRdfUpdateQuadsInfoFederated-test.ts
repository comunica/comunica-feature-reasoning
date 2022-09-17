import type { MediatorRdfFilterExistingQuads } from '@comunica/bus-rdf-filter-existing-quads';
import type {
  IActionRdfUpdateQuadsInfo,
  IActorRdfUpdateQuadsInfoOutput,
  MediatorRdfUpdateQuadsInfo,
} from '@comunica/bus-rdf-update-quads-info';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { Bus, ActionContext } from '@comunica/core';
import { empty, fromArray } from 'asynciterator';
import { DataFactory, Store } from 'n3';
import { ActorRdfUpdateQuadsInfoFederated } from '../lib/ActorRdfUpdateQuadsInfoFederated';

const { quad, namedNode } = DataFactory;

describe('ActorRdfUpdateQuadsInfoFederated', () => {
  let bus: any;
  let store: Store;
  let context: ActionContext;
  let mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;
  let mediatorFilterExistingQuads: MediatorRdfFilterExistingQuads;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    store = new Store();
    context = new ActionContext({
      [KeysRdfUpdateQuads.destination.name]: store,
    });
    // @ts-expect-error
    mediatorRdfUpdateQuadsInfo = {
      async mediate(action: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
        return {
          async execute() {
            const _store = action.context.get<Store>(KeysRdfUpdateQuads.destination)!;
            let { quadStreamInsert } = action;
            if (quadStreamInsert)
            { quadStreamInsert = quadStreamInsert.filter(_quad => <boolean> <unknown> _store.addQuad(_quad)); }
            return { quadStreamInsert };
          },
        };
      },
    };
    // @ts-expect-error
    mediatorFilterExistingQuads = {
      async mediate(action) {
        return {
          async execute() {
            const _store = action.context.get<Store>(KeysRdfResolveQuadPattern.source)!;
            let { quadStream } = action;
            if (quadStream && action.filterSource)
            { quadStream = quadStream.filter(_quad => !_store.has(_quad)); }

            if (action.filterDestination)
            { throw new Error('Cannot filter destination'); }

            return { quadStream };
          },
        };
      },
    };
  });

  describe('An ActorRdfUpdateQuadsInfoFederated instance', () => {
    let actor: ActorRdfUpdateQuadsInfoFederated;

    beforeEach(() => {
      actor = new ActorRdfUpdateQuadsInfoFederated({
        name: 'actor',
        bus,
        mediatorRdfUpdateQuadsInfo,
        mediatorFilterExistingQuads,
      });
    });

    it('should test', async() => {
      await expect(actor.test({
        context,
        filterSource: false,
      })).resolves.toEqual(true);

      await expect(actor.test({
        context,
        filterSource: false,
        quadStreamInsert: empty(),
      })).resolves.toEqual(true);

      await expect(actor.test({
        context,
        filterSource: false,
        quadStreamInsert: empty(),
        quadStreamDelete: empty(),
      })).rejects.toThrowError();

      await expect(actor.test({
        context,
        filterSource: false,
        quadStreamInsert: empty(),
        deleteGraphs: {
          graphs: 'NAMED',
          requireExistence: true,
          dropGraphs: false,
        },
      })).rejects.toThrowError();

      // TODO: Check this
      await expect(actor.test({
        context,
        filterSource: true,
      })).resolves.toEqual(true);

      await expect(actor.test({
        context: context.delete(KeysRdfUpdateQuads.destination),
        filterSource: false,
      })).rejects.toThrowError();

      await expect(actor.test({
        context: context.delete(KeysRdfUpdateQuads.destination),
        filterSource: true,
      })).rejects.toThrowError();
    });

    // TODO: Add some more tests here
    it('should run', async() => {
      const { quadStreamInsert: q1 } = await (await actor.run({
        quadStreamInsert: <any>fromArray([
          quad(namedNode('s'), namedNode('s'), namedNode('s')),
        ]),
        context,
        filterSource: false,
      })).execute();

      expect(await q1?.toArray() ?? []).toHaveLength(1);

      const { quadStreamInsert: q2 } = await (await actor.run({
        quadStreamInsert: <any>fromArray([
          quad(namedNode('s'), namedNode('s'), namedNode('s')),
        ]),
        context,
        filterSource: false,
      })).execute();

      expect(await q2?.toArray() ?? []).toHaveLength(0);
    });
  });
});
