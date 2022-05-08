import { ActionContext, Bus } from '@comunica/core';
import { ActorRuleEvaluateRestriction } from '../lib/ActorRuleEvaluateRestriction';
import { mediatorRdfResolveQuadPattern } from '@comunica/reasoning-mocks';
import { RULES } from '@comunica/reasoning-mocks/lib/mediatorRuleResolve';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { Store, DataFactory } from 'n3';
import { IReasonGroup, IReasonStatus } from '@comunica/reasoning-types';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
const { quad, namedNode } = DataFactory;

describe('ActorRuleEvaluateRestriction', () => {
  let bus: any;
  let context: ActionContext;
  let reasoningGroup: IReasonGroup;
  let store: Store;
  let implicitDestination: Store;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });

    implicitDestination = new Store();
    store = new Store();

    reasoningGroup = {
      status: { type: 'full', reasoned: false },
      dataset: implicitDestination,
      context: new ActionContext()
    }

    context = new ActionContext({
      [KeysRdfResolveQuadPattern.source.name]: store,
      [KeysRdfReason.data.name]: reasoningGroup
    })
  });

  describe('An ActorRuleEvaluateRestriction instance', () => {
    let actor: ActorRuleEvaluateRestriction;

    beforeEach(() => {
      actor = new ActorRuleEvaluateRestriction({ name: 'actor', bus, mediatorRdfResolveQuadPattern });
    });

    it('should test', async () => {
      await expect(actor.test({ 
        rule: RULES['my-unnested-rules'][0],
        context,
      })).resolves.toEqual(true);

      await expect(actor.test({ 
        rule: { ruleType: 'rdfs', premise: [], conclusion: false },
        context,
      })).rejects.toThrowError();
    });

    it('should run on no data', async () => {
      const { results } = await actor.run({ 
        rule: RULES['my-unnested-rules'][0],
        context,
      })
      return expect(results.toArray()).resolves.toEqual([]);
    });

    it('should run with data in the store', async () => {
      store.addQuads([
        quad(
          namedNode('j'),
          namedNode('http://example.org#a'),
          namedNode('m'),
        ),
        quad(
          namedNode('m'),
          namedNode('http://example.org#subsetOf'),
          namedNode('m2'),
        ),
      ])

      const { results } = await actor.run({ 
        rule: RULES['my-unnested-rules'][0],
        context,
      })
      return expect(results.toArray()).resolves.toBeRdfIsomorphic([
        quad(
          namedNode('j'),
          namedNode('http://example.org#a'),
          namedNode('m2'),
        ),
      ]);
    });

    it('should run with data across stores', async () => {
      const { results } = await actor.run({ 
        rule: RULES['my-unnested-rules'][0],
        context: context.delete(KeysRdfResolveQuadPattern.source).set(KeysRdfResolveQuadPattern.sources, [
          new Store([
            quad(
              namedNode('j'),
              namedNode('http://example.org#a'),
              namedNode('m'),
            )
          ]),
          new Store([
            quad(
              namedNode('m'),
              namedNode('http://example.org#subsetOf'),
              namedNode('m2'),
            ),
          ])
        ])
      })
      return expect(results.toArray()).resolves.toBeRdfIsomorphic([
        quad(
          namedNode('j'),
          namedNode('http://example.org#a'),
          namedNode('m2'),
        ),
      ]);
    });
  });
});
