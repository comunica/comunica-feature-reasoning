import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { mediatorRdfResolveQuadPattern } from '@comunica/reasoning-mocks';
import { RULES } from '@comunica/reasoning-mocks/lib/mediatorRuleResolve';
import type { IReasonGroup } from '@comunica/reasoning-types';
import { Store, DataFactory } from 'n3';
import { ActorRuleEvaluateRestriction } from '../lib/ActorRuleEvaluateRestriction';

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
      context: new ActionContext(),
    };

    context = new ActionContext({
      [KeysRdfResolveQuadPattern.source.name]: store,
      [KeysRdfReason.data.name]: reasoningGroup,
    });
  });

  describe('An ActorRuleEvaluateRestriction instance', () => {
    let actor: ActorRuleEvaluateRestriction;

    beforeEach(() => {
      actor = new ActorRuleEvaluateRestriction({ name: 'actor', bus, mediatorRdfResolveQuadPattern });
    });

    it('should test', async() => {
      await expect(actor.test({
        rule: RULES['my-unnested-rules'][0],
        context,
      })).resolves.toEqual(true);

      await expect(actor.test({
        rule: { ruleType: 'rdfs', premise: [], conclusion: false },
        context,
      })).rejects.toThrowError();
    });

    it('should run on no data', async() => {
      const { results } = await actor.run({
        rule: RULES['my-unnested-rules'][0],
        context,
      });
      await expect(results.toArray()).resolves.toEqual([]);
    });

    it('should run with data in the store', async() => {
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
      ]);

      const { results } = await actor.run({
        rule: RULES['my-unnested-rules'][0],
        context,
      });
      await expect(results.toArray()).resolves.toBeRdfIsomorphic([
        quad(
          namedNode('j'),
          namedNode('http://example.org#a'),
          namedNode('m2'),
        ),
      ]);
    });

    it('should run with data across stores', async() => {
      const { results } = await actor.run({
        rule: RULES['my-unnested-rules'][0],
        context: context.delete(KeysRdfResolveQuadPattern.source).set(KeysRdfResolveQuadPattern.sources, [
          new Store([
            quad(
              namedNode('j'),
              namedNode('http://example.org#a'),
              namedNode('m'),
            ),
          ]),
          new Store([
            quad(
              namedNode('m'),
              namedNode('http://example.org#subsetOf'),
              namedNode('m2'),
            ),
          ]),
        ]),
      });
      await expect(results.toArray()).resolves.toBeRdfIsomorphic([
        quad(
          namedNode('j'),
          namedNode('http://example.org#a'),
          namedNode('m2'),
        ),
      ]);
    });

    it('should work with rules that contain repeated variables in a premise pattern', async() => {
      const { results } = await actor.run({
        rule: RULES['overlapping-variables'][0],
        context: context.delete(KeysRdfResolveQuadPattern.source).set(KeysRdfResolveQuadPattern.sources, [
          new Store([
            quad(
              namedNode('j'),
              namedNode('j'),
              namedNode('j'),
            ),
          ]),
          new Store([
            quad(
              namedNode('m'),
              namedNode('http://example.org#subsetOf'),
              namedNode('m2'),
            ),
          ]),
        ]),
      });
      await expect(results.toArray()).resolves.toBeRdfIsomorphic([
        quad(
          namedNode('j'),
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          namedNode('http://example.org/repeated'),
        ),
      ]);
    });
  });
});
