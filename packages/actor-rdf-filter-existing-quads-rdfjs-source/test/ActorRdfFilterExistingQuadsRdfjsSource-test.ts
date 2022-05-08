import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfFilterExistingQuadsRdfjsSource } from '../lib/ActorRdfFilterExistingQuadsRdfjsSource';
import { Store , DataFactory } from 'n3';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { empty, fromArray } from 'asynciterator';
const { quad, namedNode } = DataFactory;

describe('ActorRdfFilterExistingQuadsRdfjsSource', () => {
  let bus: any;
  let store: Store;
  let context: ActionContext;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    store = new Store([
      quad(namedNode('s'), namedNode('p'), namedNode('o'))
    ]);
    context = new ActionContext({
      [KeysRdfResolveQuadPattern.source.name]: store,
    });
  });

  describe('An ActorRdfFilterExistingQuadsRdfjsSource instance', () => {
    let actor: ActorRdfFilterExistingQuadsRdfjsSource;

    beforeEach(() => {
      actor = new ActorRdfFilterExistingQuadsRdfjsSource({ name: 'actor', bus });
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
        context: context.delete(KeysRdfResolveQuadPattern.source)
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
        filterSource: true,
        context
       });

       expect((await r.execute()).quadStream.toArray()).resolves.toBeRdfIsomorphic([
        quad(namedNode('s'), namedNode('p'), namedNode('o2'))
      ]);
    });
  });
});
