import type { EventEmitter } from 'events';
import { IActionRdfReason, IActorRdfReasonOutput, implicitGroupFactory, IReasonGroup } from '@comunica/bus-rdf-reason';
import { KeysRdfReason } from '@comunica/bus-rdf-reason';
import type { IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput, MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import type { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput, MediatorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads';
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { ActionContext, Actor, Bus, IAction, IActorOutput, IActorTest } from '@comunica/core';
import type { IDataSource, IDataDestination } from '@comunica/types';
import { namedNode, quad, variable } from '@rdfjs/data-model';
import * as RDF from '@rdfjs/types';
import { wrap, union, fromArray, UnionIterator } from 'asynciterator';
import { Store } from 'n3';
import { ActorRdfReasonRuleRestriction } from '../lib/ActorRdfReasonRuleRestriction';
import { promisifyEventEmitter } from 'event-emitter-promisify';

import 'jest-rdf';
import { IActorRuleResolveOutput, MediatorRuleResolve } from '@comunica/bus-rule-resolve';
import { MediatorOptimizeRule } from '@comunica/bus-optimize-rule';
import { Rule } from '@comunica/reasoning-types';
type Data = IDataDestination & IDataSource;

describe('ActorRdfReasonRuleRestriction', () => {
  let bus: Bus<Actor<IActionRdfReason, IActorTest, IActorRdfReasonOutput>, IActionRdfReason, IActorTest, IActorRdfReasonOutput>;
  let mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
  let mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;
  let mediatorRuleResolve: MediatorRuleResolve;
  let mediatorOptimizeRule: MediatorOptimizeRule;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    // @ts-ignore
    mediatorRdfUpdateQuads = {
      async mediate(action: IActionRdfUpdateQuads): Promise<IActorRdfUpdateQuadsOutput> {
        const destination: Store = action.context.get(KeysRdfUpdateQuads.destination)!;
        return {
          execute: () => {
            return promisifyEventEmitter(destination.import(action.quadStreamInsert as any))
          },
        };
      },
    };
    // @ts-ignore
    mediatorRdfResolveQuadPattern = {
      async mediate(action: IActionRdfResolveQuadPattern): Promise<IActorRdfResolveQuadPatternOutput> {
        const sources: Store[] = action.context.get(KeysRdfResolveQuadPattern.source) ?
          [action.context.get(KeysRdfResolveQuadPattern.source)!] :
          action.context.get(KeysRdfResolveQuadPattern.sources) ?? [];

        function toUndef<T extends { termType: string }>(term: T): any { return term.termType === 'Variable' ? undefined : term; };

        return {
          data: new UnionIterator<RDF.Quad>(sources.map((source: Store) => wrap(source.match(
            toUndef(action.pattern.subject),
            toUndef(action.pattern.predicate),
            toUndef(action.pattern.object),
            toUndef(action.pattern.graph),
          ))), { autoStart: false }),
        };
      },
    };
    // @ts-ignore
    mediatorOptimizeRule = {
      async mediate(action) {
        return action;
      }
    }
    // @ts-ignore
    mediatorRuleResolve = {
      async mediate(action): Promise<IActorRuleResolveOutput> {
        return {
          data: fromArray<Rule>([
            {
              ruleType: 'premise-conclusion',
              premise: [
                quad(
                  variable('?s'),
                  namedNode('http://example.org#a'),
                  variable('?o'),
                  variable('?g'),
                ),
                quad(
                  variable('?o'),
                  namedNode('http://example.org#subsetOf'),
                  variable('?o2'),
                  variable('?g'),
                ),
              ],
              conclusion: [
                quad(
                  variable('?s'),
                  namedNode('http://example.org#a'),
                  variable('?o2'),
                  variable('?g'),
                ),
              ],
            },
            {
              ruleType: 'premise-conclusion',
              premise: [
                quad(
                  variable('?s'),
                  namedNode('http://example.org#a'),
                  variable('?o'),
                  variable('?g'),
                ),
              ],
              conclusion: [
                quad(
                  variable('?o'),
                  namedNode('http://example.org#a'),
                  namedNode('http://example.org#Class'),
                  variable('?g'),
                ),
              ],
            },
          ])
        };
      },
    }
  });

  describe('An ActorRdfReasonRuleRestriction instance', () => {
    let actor: ActorRdfReasonRuleRestriction;
    let action: IActionRdfReason;
    let data: IReasonGroup;
    let destination: Store;
    let source: Store;


    beforeEach(() => {
      actor = new ActorRdfReasonRuleRestriction({
        name: 'actor',
        bus,
        mediatorRdfUpdateQuads,
        mediatorRdfResolveQuadPattern,
        mediatorRuleResolve,
        mediatorOptimizeRule
      });

      data = implicitGroupFactory(
        new ActionContext({
          [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
        })
      );

      destination = new Store();

      source = new Store();

      action = {
        context: new ActionContext({
          [KeysRdfReason.data.name]: data,
          [KeysRdfReason.rules.name]: 'my-rules',
          [KeysRdfUpdateQuads.destination.name]: destination,
          [KeysRdfResolveQuadPattern.source.name]: source
        }),
      }
    });

    // TODO: Implement this
    it('should test', () => {
      return expect(actor.test(action)).resolves.toEqual(true); // TODO
    });

    it('Should error if missing an implicit destination', () => {
      return expect(actor.test({ ...action, context: action.context.delete(KeysRdfReason.data) })).rejects.toThrowError();
    })

    it('should run with no rules and empty data', async () => {
      const { execute } = await actor.run(action);
      await expect(execute()).resolves.toBeUndefined();
    });

    it('should run with empty data', async () => {

      const { execute } = await actor.run(action);
      await execute();
      expect(source).toBeRdfIsomorphic([])
      expect(destination).toBeRdfIsomorphic([])
      expect(data.dataset).toBeRdfIsomorphic([])
    });

    it('should run with with the fact Jesse a Human and produce implicit data', async () => {
      source.addQuad(
        quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        )
      )

      const { execute } = await actor.run(action);
      await execute();
      expect(source).toBeRdfIsomorphic([quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      )])
      expect(destination).toBeRdfIsomorphic([])
      expect(data.dataset).toBeRdfIsomorphic([quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ),quad(
        namedNode('http://example.org#Class'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      )]);
    });

    it('should run with with the fact Jesse a Human and produce implicit data', async () => {
      source.addQuad(
        quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        ),
      );

      source.addQuad(
        quad(
          namedNode('http://example.org#Human'),
          namedNode('http://example.org#subsetOf'),
          namedNode('http://example.org#Thing'),
        ),
      );

      const { execute } = await actor.run(action);
      await execute();

      expect(source).toBeRdfIsomorphic([quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      ),
      quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#subsetOf'),
        namedNode('http://example.org#Thing'),
      ),])
      expect(destination).toBeRdfIsomorphic([]);
      expect((data.dataset as any).size).toEqual(4);
      expect(data.dataset).toBeRdfIsomorphic([quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Thing'),
      ),
      quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      )
        ,
      quad(
        namedNode('http://example.org#Thing'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      )
        ,
      quad(
        namedNode('http://example.org#Class'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      )


      ]);
    });
  });
});
