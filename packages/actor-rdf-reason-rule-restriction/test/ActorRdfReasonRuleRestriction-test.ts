import type { IActionRdfReason, IActorRdfReasonOutput, IReasonGroup } from '@comunica/bus-rdf-reason';
import { implicitGroupFactory, KeysRdfReason } from '@comunica/bus-rdf-reason';
import type { IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput, MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import type { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput, MediatorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads';
import type { IActorRuleResolveOutput, MediatorRuleResolve } from '@comunica/bus-rule-resolve';
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { Actor, IActorTest } from '@comunica/core';
import { ActionContext, Bus } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import type { IDataSource, IDataDestination } from '@comunica/types';
import { namedNode, quad, variable } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import { wrap, fromArray, UnionIterator } from 'asynciterator';
import { promisifyEventEmitter } from 'event-emitter-promisify';
import { Store } from 'n3';
import { ActorRdfReasonRuleRestriction } from '../lib/ActorRdfReasonRuleRestriction';

import 'jest-rdf';
import type { MediatorOptimizeRule } from '@comunica/bus-optimize-rule';
type Data = IDataDestination & IDataSource;

// TODO: Add tests with blank nodes

const RULES: Record<string, Rule[]> = {
  'my-unnested-rules': [
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
  ],
  'my-nested-rules': [
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
      // TODO: Get the types working here
      // @ts-expect-error
      next: {
        premise: [
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
    },
  ],
};

describe('ActorRdfReasonRuleRestriction', () => {
  let bus: Bus<Actor<IActionRdfReason, IActorTest, IActorRdfReasonOutput>, IActionRdfReason, IActorTest, IActorRdfReasonOutput>;
  let mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
  let mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;
  let mediatorRuleResolve: MediatorRuleResolve;
  let mediatorOptimizeRule: MediatorOptimizeRule;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    // @ts-expect-error
    mediatorRdfUpdateQuads = {
      async mediate(action: IActionRdfUpdateQuads): Promise<IActorRdfUpdateQuadsOutput> {
        const destination: Store = action.context.get(KeysRdfUpdateQuads.destination)!;
        return {
          execute() {
            return promisifyEventEmitter(destination.import(action.quadStreamInsert as any));
          },
        };
      },
    };
    // @ts-expect-error
    mediatorRdfResolveQuadPattern = {
      async mediate(action: IActionRdfResolveQuadPattern): Promise<IActorRdfResolveQuadPatternOutput> {
        const sources: Store[] = action.context.get(KeysRdfResolveQuadPattern.source) ?
          [ action.context.get(KeysRdfResolveQuadPattern.source)! ] :
          action.context.get(KeysRdfResolveQuadPattern.sources) ?? [];

        function toUndef<T extends { termType: string }>(term: T): any { return term.termType === 'Variable' ? undefined : term; }

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
    // @ts-expect-error
    mediatorOptimizeRule = {
      async mediate(action) {
        return action;
      },
    };
    // @ts-expect-error
    mediatorRuleResolve = {
      async mediate(action): Promise<IActorRuleResolveOutput> {
        const ruleString: string = action.context.get(KeysRdfReason.rules)!;
        return {
          data: fromArray<Rule>(RULES[ruleString]),
        };
      },
    };
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
        mediatorOptimizeRule,
      });

      data = implicitGroupFactory(
        new ActionContext({
          [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
        }),
      );

      destination = new Store();

      source = new Store();

      action = {
        context: new ActionContext({
          [KeysRdfReason.data.name]: data,
          [KeysRdfReason.rules.name]: 'my-unnested-rules',
          [KeysRdfUpdateQuads.destination.name]: destination,
          [KeysRdfResolveQuadPattern.source.name]: source,
        }),
      };
    });

    // TODO: Implement this
    it('should test', () => {
      return expect(actor.test(action)).resolves.toEqual(true); // TODO
    });

    it('Should error if missing an implicit destination', () => {
      return expect(actor.test({ ...action, context: action.context.delete(KeysRdfReason.data) })).rejects.toThrowError();
    });

    it('should run with no rules and empty data', async() => {
      const { execute } = await actor.run(action);
      await expect(execute()).resolves.toBeUndefined();
    });

    it('should run with empty data', async() => {
      const { execute } = await actor.run(action);
      await execute();
      expect(source).toBeRdfIsomorphic([]);
      expect(destination).toBeRdfIsomorphic([]);
      expect(data.dataset).toBeRdfIsomorphic([]);
    });

    it('should run with with the fact Jesse a Human and produce implicit data', async() => {
      source.addQuad(
        quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        ),
      );

      const { execute } = await actor.run(action);
      await execute();
      expect(source).toBeRdfIsomorphic([ quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      ) ]);
      expect(destination).toBeRdfIsomorphic([]);
      expect(data.dataset).toBeRdfIsomorphic([ quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ), quad(
        namedNode('http://example.org#Class'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ) ]);
    });

    it('should run with with the facts Jesse a Human / human subset of thing and produce implicit data', async() => {
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

      expect(source).toBeRdfIsomorphic([ quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      ),
      quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#subsetOf'),
        namedNode('http://example.org#Thing'),
      ) ]);
      expect(destination).toBeRdfIsomorphic([]);
      expect((data.dataset as any).size).toEqual(4);
      expect(data.dataset).toBeRdfIsomorphic([ quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Thing'),
      ),
      quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ),
      quad(
        namedNode('http://example.org#Thing'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ),
      quad(
        namedNode('http://example.org#Class'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ),
      ]);
    });

    it('should run with with the facts Jesse a Human / Ruben a human / human a thing to produce implicit data', async() => {
      source.addQuad(
        quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        ),
      );

      source.addQuad(
        quad(
          namedNode('http://example.org#Ruben'),
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

      expect(source).toBeRdfIsomorphic([ quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      ),
      quad(
        namedNode('http://example.org#Ruben'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      ), quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#subsetOf'),
        namedNode('http://example.org#Thing'),
      ) ]);
      expect(destination).toBeRdfIsomorphic([]);
      expect((data.dataset as any).size).toEqual(5);
      expect(data.dataset).toBeRdfIsomorphic([ quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ),
      quad(
        namedNode('http://example.org#Class'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ),
      quad(
        namedNode('http://example.org#Thing'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ), quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Thing'),
      ),
      quad(
        namedNode('http://example.org#Ruben'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Thing'),
      ),
      ]);
    });

    it('should run with with the facts Jesse a Human / Ruben a human to produce implicit data', async() => {
      source.addQuad(
        quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        ),
      );

      source.addQuad(
        quad(
          namedNode('http://example.org#Ruben'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        ),
      );

      const { execute } = await actor.run(action);
      await execute();

      expect(source).toBeRdfIsomorphic([ quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      ),
      quad(
        namedNode('http://example.org#Ruben'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      ) ]);
      expect(destination).toBeRdfIsomorphic([]);
      expect((data.dataset as any).size).toEqual(2);
      expect(data.dataset).toBeRdfIsomorphic([ quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ),
      quad(
        namedNode('http://example.org#Class'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ),
      ]);
    });

    describe('Using nested rules', () => {
      beforeEach(() => {
        action.context = action.context.set(KeysRdfReason.rules, 'my-nested-rules');
      });

      it('should run with with the fact Jesse a Human and produce implicit data', async() => {
        source.addQuad(
          quad(
            namedNode('http://example.org#Jesse'),
            namedNode('http://example.org#a'),
            namedNode('http://example.org#Human'),
          ),
        );

        const { execute } = await actor.run(action);
        await execute();
        expect(source).toBeRdfIsomorphic([ quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        ) ]);
        expect(destination).toBeRdfIsomorphic([]);
        expect(data.dataset).toBeRdfIsomorphic([ quad(
          namedNode('http://example.org#Human'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
        ), quad(
          namedNode('http://example.org#Class'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
        ) ]);
      });

      it('should run with with the facts Jesse a Human / human subset of thing and produce implicit data', async() => {
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

        expect(source).toBeRdfIsomorphic([ quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        ),
        quad(
          namedNode('http://example.org#Human'),
          namedNode('http://example.org#subsetOf'),
          namedNode('http://example.org#Thing'),
        ) ]);
        expect(destination).toBeRdfIsomorphic([]);
        expect((data.dataset as any).size).toEqual(4);
        expect(data.dataset).toBeRdfIsomorphic([ quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Thing'),
        ),
        quad(
          namedNode('http://example.org#Human'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
        ),
        quad(
          namedNode('http://example.org#Thing'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
        ),
        quad(
          namedNode('http://example.org#Class'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
        ),
        ]);
      });
    });
  });
});
