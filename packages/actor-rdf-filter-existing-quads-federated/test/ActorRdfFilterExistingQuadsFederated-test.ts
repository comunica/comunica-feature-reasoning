import { MediatorRdfFilterExistingQuads } from '@comunica/bus-rdf-filter-existing-quads';
import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfFilterExistingQuads } from '@comunica/bus-rdf-filter-existing-quads';
import { ActorRdfFilterExistingQuadsFederated } from '../lib/ActorRdfFilterExistingQuadsFederated';
import { empty, fromArray } from 'asynciterator';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { Store, DataFactory } from 'n3';
import { getContextSource } from '@comunica/bus-rdf-resolve-quad-pattern';

const { namedNode, quad } = DataFactory;

describe('ActorRdfFilterExistingQuadsFederated', () => {
  let bus: any;
  let context: ActionContext;
  let mediatorRdfFilterExistingQuads: MediatorRdfFilterExistingQuads;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });

    // @ts-ignore
    mediatorRdfFilterExistingQuads = {
      async mediate(action) {
        return {
          async execute() {
            const { value: store } = getContextSource(action.context) as { value: Store };

            return { quadStream: action.quadStream.filter(quad => !store.has(quad)) };
          }
        }
      }
    }

    context = new ActionContext({
      [KeysRdfResolveQuadPattern.sources.name]: [new Store([ quad(namedNode('s'), namedNode('p'), namedNode('o')) ]), new Store()]
    });
  });

  describe('An ActorRdfFilterExistingQuadsFederated instance', () => {
    let actor: ActorRdfFilterExistingQuadsFederated;

    beforeEach(() => {
      actor = new ActorRdfFilterExistingQuadsFederated({ name: 'actor', bus, mediatorRdfFilterExistingQuads });
    });

    it('should test', async () => {
      await expect(actor.test({
        quadStream: empty(),
        filterDestination: false,
        filterSource: true,
        context
      })).resolves.toEqual(true);

      await expect(actor.test({
        quadStream: empty(),
        filterDestination: false,
        filterSource: true,
        context: context.delete(KeysRdfResolveQuadPattern.sources)
      })).rejects.toThrowError();

      await expect(actor.test({
        quadStream: empty(),
        filterDestination: true,
        filterSource: true,
        context
      })).rejects.toThrowError();

      await expect(actor.test({
        quadStream: empty(),
        filterDestination: true,
        filterSource: false,
        context
      })).rejects.toThrowError();

      await expect(actor.test({
        quadStream: empty(),
        filterDestination: false,
        filterSource: false,
        context
      })).rejects.toThrowError();
    });

    it('should run', async () => {
      const r = await actor.run({
        quadStream: <any> fromArray([
          quad(namedNode('s'), namedNode('p'), namedNode('o')),
          quad(namedNode('s'), namedNode('p'), namedNode('o2'))
        ]),
        filterDestination: false,
        filterSource: false,
        context
      });

      expect((await r.execute()).quadStream.toArray()).resolves.toBeRdfIsomorphic([
        quad(namedNode('s'), namedNode('p'), namedNode('o2'))
      ]);
    });
  });
});
