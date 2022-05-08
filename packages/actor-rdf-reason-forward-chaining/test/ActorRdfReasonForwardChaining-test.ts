import { getContextSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import { IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoOutput, MediatorRdfUpdateQuadsInfo } from '@comunica/bus-rdf-update-quads-info';
import { IActionRuleEvaluate, IActorRuleEvaluateOutput, MediatorRuleEvaluate } from '@comunica/bus-rule-evaluate';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { IReasonGroup } from '@comunica/reasoning-types';
import { IActionContext } from '@comunica/types';
import * as RDF from '@rdfjs/types';
import { UnionIterator, single, AsyncIterator, wrap, fromArray } from 'asynciterator';
import { Store, DataFactory } from 'n3';
import { forEachTerms, mapTerms } from 'rdf-terms';
import { Algebra } from 'sparqlalgebrajs';
import { ActorRdfReasonForwardChaining } from '../lib/ActorRdfReasonForwardChaining';
import { hasContextSingleSource, getContextSources } from '@comunica/bus-rdf-resolve-quad-pattern';
import { mediatorRuleResolve, mediatorOptimizeRule, mediatorRdfResolveQuadPattern, mediatorRuleEvaluate } from '@comunica/reasoning-mocks';
import { ActorRuleEvaluateRestriction } from '@comunica/actor-rule-evaluate-restriction';
const { quad, namedNode } = DataFactory

describe('ActorRdfReasonForwardChaining', () => {
  let bus: any;
  let store: Store;
  let implicitDestination: Store;
  let reasoningGroup: IReasonGroup;
  let context: IActionContext;
  let mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;

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

      // @ts-ignore
      mediatorRdfUpdateQuadsInfo = {
        async mediate(action: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
          return {
            execute: async () => {
              const dest: Store = action.context.getSafe<Store>(KeysRdfUpdateQuads.destination);
              // TODO: Remove type casting once https://github.com/rdfjs/N3.js/issues/286 is merged
              let quadStreamInsert = action.quadStreamInsert?.filter(quad => dest.addQuad(quad) as unknown as boolean);

              hasContextSingleSource(action.context)

              if (action.filterSource) {
                if (hasContextSingleSource(action.context)) {
                  const source: Store = getContextSource(action.context) as Store;
                  quadStreamInsert = quadStreamInsert?.filter(quad => !source.has(quad));
                } else {
                  const sources = getContextSources(action.context) as Store[];
                  quadStreamInsert = quadStreamInsert?.filter(quad => sources.every(store => !store.has(quad)));
                }
                
              }

              return { quadStreamInsert };
            }
          }
        }
      }

      actor = new ActorRdfReasonForwardChaining({
        name: 'actor',
        bus,
        mediatorRuleEvaluate,
        mediatorRdfUpdateQuadsInfo,
        mediatorRuleResolve,
        mediatorOptimizeRule
        // TODO: Remove this once we do not require unecessary mediators
      } as any);
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
    });
  });
});
