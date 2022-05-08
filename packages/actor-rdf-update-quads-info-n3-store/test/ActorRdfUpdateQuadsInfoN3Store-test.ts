import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfUpdateQuadsInfoN3Store } from '../lib/ActorRdfUpdateQuadsInfoN3Store';
import { Store, DataFactory } from 'n3';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { empty, fromArray } from 'asynciterator';
const { quad, namedNode } = DataFactory;

describe('ActorRdfUpdateQuadsInfoN3Store', () => {
  let bus: any;
  let store: Store;
  let context: ActionContext;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    store = new Store();
    context = new ActionContext({
      [KeysRdfUpdateQuads.destination.name]: store,
    })
  });

  describe('An ActorRdfUpdateQuadsInfoN3Store instance', () => {
    let actor: ActorRdfUpdateQuadsInfoN3Store;

    beforeEach(() => {
      actor = new ActorRdfUpdateQuadsInfoN3Store({ name: 'actor', bus });
    });

    it('should test', async () => {
      await expect(actor.test({
        context,
        filterSource: false
      })).resolves.toEqual(true);

      await expect(actor.test({
        context,
        filterSource: false,
        quadStreamInsert: empty()
      })).resolves.toEqual(true);

      await expect(actor.test({
        context,
        filterSource: false,
        quadStreamInsert: empty(),
        quadStreamDelete: empty()
      })).rejects.toThrowError();

      await expect(actor.test({
        context,
        filterSource: false,
        quadStreamInsert: empty(),
        deleteGraphs: {
          graphs: 'NAMED',
          requireExistence: true,
          dropGraphs: false
        }
      })).rejects.toThrowError();

      await expect(actor.test({
        context,
        filterSource: true
      })).rejects.toThrowError();

      await expect(actor.test({
        context: context.set(KeysRdfUpdateQuads.destination, {}),
        filterSource: false
      })).rejects.toThrowError();

      await expect(actor.test({
        context: context.delete(KeysRdfUpdateQuads.destination),
        filterSource: false
      })).rejects.toThrowError();
    });

    it('should run', async () => {
      const { quadStreamInsert: q1 } = await (await actor.run({ quadStreamInsert: <any> fromArray([
        quad(namedNode('s'), namedNode('s'), namedNode('s'))
      ]), context, filterSource: false })).execute();

      expect(await q1?.toArray() ?? []).toHaveLength(1);

      const { quadStreamInsert: q2 } = await (await actor.run({ quadStreamInsert: <any> fromArray([
        quad(namedNode('s'), namedNode('s'), namedNode('s'))
      ]), context, filterSource: false })).execute();

      expect(await q2?.toArray() ?? []).toHaveLength(0);
    });

    it('should run with sourceIDs', async () => {
      let map = new Map<Store, number>();
      map = map.set(store, 1);

      const { quadStreamInsert: q1 } = await (await actor.run({ quadStreamInsert: <any> fromArray([
        quad(namedNode('s'), namedNode('s'), namedNode('s'))
      ]), context: context.set(KeysRdfResolveQuadPattern.sourceIds, map), filterSource: false })).execute();

      expect(await q1?.toArray() ?? []).toHaveLength(1);
    });
  });
});
