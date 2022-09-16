import type { MediatorRdfFilterExistingQuads } from '@comunica/bus-rdf-filter-existing-quads';
import { getContextSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { empty, fromArray } from 'asynciterator';
import { Store, DataFactory } from 'n3';
import { ActorRdfFilterExistingQuadsFederated } from '../lib/ActorRdfFilterExistingQuadsFederated';

const { namedNode, quad } = DataFactory;

describe('ActorRdfFilterExistingQuadsFederated', () => {
  let bus: any;
  let context: ActionContext;
  let mediatorRdfFilterExistingQuads: MediatorRdfFilterExistingQuads;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });

    // @ts-expect-error
    mediatorRdfFilterExistingQuads = {
      async mediate(action) {
        return {
          async execute() {
            const { value: store } = <{ value: Store }> getContextSource(action.context);

            return { quadStream: action.quadStream.filter(_quad => !store.has(_quad)) };
          },
        };
      },
    };

    context = new ActionContext({
      [KeysRdfResolveQuadPattern.sources.name]: [
        new Store([ quad(namedNode('s'), namedNode('p'), namedNode('o')) ]),
        new Store(),
      ],
    });
  });

  describe('An ActorRdfFilterExistingQuadsFederated instance', () => {
    let actor: ActorRdfFilterExistingQuadsFederated;

    beforeEach(() => {
      actor = new ActorRdfFilterExistingQuadsFederated({ name: 'actor', bus, mediatorRdfFilterExistingQuads });
    });

    it('should test', async() => {
      await expect(actor.test({
        quadStream: empty(),
        filterDestination: false,
        filterSource: true,
        context,
      })).resolves.toEqual(true);

      await expect(actor.test({
        quadStream: empty(),
        filterDestination: false,
        filterSource: true,
        context: context.delete(KeysRdfResolveQuadPattern.sources),
      })).rejects.toThrowError();

      await expect(actor.test({
        quadStream: empty(),
        filterDestination: true,
        filterSource: true,
        context,
      })).rejects.toThrowError();

      await expect(actor.test({
        quadStream: empty(),
        filterDestination: true,
        filterSource: false,
        context,
      })).rejects.toThrowError();

      await expect(actor.test({
        quadStream: empty(),
        filterDestination: false,
        filterSource: false,
        context,
      })).rejects.toThrowError();
    });

    it('should run', async() => {
      const r = await actor.run({
        quadStream: <any> fromArray([
          quad(namedNode('s'), namedNode('p'), namedNode('o')),
          quad(namedNode('s'), namedNode('p'), namedNode('o2')),
        ]),
        filterDestination: false,
        filterSource: false,
        context,
      });

      await expect((await r.execute()).quadStream.toArray()).resolves.toBeRdfIsomorphic([
        quad(namedNode('s'), namedNode('p'), namedNode('o2')),
      ]);
    });
  });
});
