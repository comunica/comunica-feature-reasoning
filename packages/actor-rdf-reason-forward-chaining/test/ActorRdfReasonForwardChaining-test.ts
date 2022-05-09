import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { mediators } from '@comunica/reasoning-mocks';
import { IReasonGroup } from '@comunica/reasoning-types';
import { IActionContext } from '@comunica/types';
import { DataFactory, Store } from 'n3';
import { ActorRdfReasonForwardChaining } from '../lib/ActorRdfReasonForwardChaining';
const { quad, namedNode } = DataFactory

describe('ActorRdfReasonForwardChaining', () => {
  let bus: any;
  let store: Store;
  let implicitDestination: Store;
  let reasoningGroup: IReasonGroup;
  let context: IActionContext;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfReasonForwardChaining instance', () => {
    let actor: ActorRdfReasonForwardChaining;

    beforeEach(() => {
      implicitDestination = new Store();

      reasoningGroup = {
        status: { type: 'full', reasoned: false },
        dataset: implicitDestination,
        context: new ActionContext()
      }

      actor = new ActorRdfReasonForwardChaining({ name: 'actor', bus, ...mediators });
      store = new Store();
      context = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: store,
        [KeysRdfReason.data.name]: reasoningGroup,
        [KeysRdfReason.rules.name]: 'my-unnested-rules'
      })
    });

    it('should test', () => {
      // return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run with empty data', async () => {
      const { execute } = await actor.run({ context });
      await execute();
      expect(store.size).toEqual(0);
      expect(implicitDestination.size).toEqual(0);
    });

    it('should run with data', async () => {
      store.add(quad(namedNode('s'), namedNode('http://example.org#a'), namedNode('o')));
      store.add(quad(namedNode('o'), namedNode('http://example.org#subsetOf'), namedNode('o2')));
      const { execute } = await actor.run({ context });
      await execute();
      expect(store.size).toEqual(2);
      expect(implicitDestination.size).toEqual(4);
      expect(implicitDestination.has(quad(
        namedNode('http://example.org#Class'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ))).toBe(true);
    });
  });
});
