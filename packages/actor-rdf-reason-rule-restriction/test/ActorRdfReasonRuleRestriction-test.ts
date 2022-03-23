import type { IActionRdfReason, IActorRdfReasonOutput, IReasonGroup } from '@comunica/bus-rdf-reason';
import { implicitGroupFactory, KeysRdfReason } from '@comunica/bus-rdf-reason';
import type { IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput, MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import type { Actor, IActorTest } from '@comunica/core';
import { ActionContext, Bus } from '@comunica/core';
import { mediatorOptimizeRule, mediatorRdfUpdateQuads, mediatorRuleResolve } from '@comunica/reasoning-mocks';
import type { IDataDestination, IDataSource } from '@comunica/types';
import { namedNode, quad } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import { UnionIterator, wrap } from 'asynciterator';
import 'jest-rdf';
import { Store } from 'n3';
import { ActorRdfReasonRuleRestriction } from '../lib/ActorRdfReasonRuleRestriction';

type Data = IDataDestination & IDataSource;

// TODO: Add tests with blank nodes

describe('ActorRdfReasonRuleRestriction', () => {
  let bus: Bus<Actor<IActionRdfReason, IActorTest, IActorRdfReasonOutput>, IActionRdfReason, IActorTest, IActorRdfReasonOutput>;
  let mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    // @ts-expect-error
    mediatorRdfResolveQuadPattern = {
      async mediate(action: IActionRdfResolveQuadPattern): Promise<IActorRdfResolveQuadPatternOutput> {
        const sources: Store[] = action.context.get(KeysRdfResolveQuadPattern.source) ?
          [action.context.get(KeysRdfResolveQuadPattern.source)!] :
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

    it('should run with no rules and empty data', async () => {
      const { execute } = await actor.run(action);
      await expect(execute()).resolves.toBeUndefined();
    });

    it('should run with empty data', async () => {
      const { execute } = await actor.run(action);
      await execute();
      expect(source).toBeRdfIsomorphic([]);
      expect(destination).toBeRdfIsomorphic([]);
      expect(data.dataset).toBeRdfIsomorphic([]);
    });

    it('should run with with the fact Jesse a Human and produce implicit data', async () => {
      source.addQuad(
        quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        ),
      );

      const { execute } = await actor.run(action);
      await execute();
      expect(source).toBeRdfIsomorphic([quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      )]);
      expect(destination).toBeRdfIsomorphic([]);
      expect(data.dataset).toBeRdfIsomorphic([quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      ), quad(
        namedNode('http://example.org#Class'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Class'),
      )]);
    });

    it('should run with with the facts Jesse a Human / human subset of thing and produce implicit data', async () => {
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
      )]);
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

    it('should run with with the facts Jesse a Human / Ruben a human / human a thing to produce implicit data', async () => {
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

      expect(source).toBeRdfIsomorphic([quad(
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
      )]);
      expect(destination).toBeRdfIsomorphic([]);
      expect((data.dataset as any).size).toEqual(5);
      expect(data.dataset).toBeRdfIsomorphic([quad(
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

    it('should run with with the facts Jesse a Human / Ruben a human to produce implicit data', async () => {
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

      expect(source).toBeRdfIsomorphic([quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      ),
      quad(
        namedNode('http://example.org#Ruben'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      )]);
      expect(destination).toBeRdfIsomorphic([]);
      expect((data.dataset as any).size).toEqual(2);
      expect(data.dataset).toBeRdfIsomorphic([quad(
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

      it('should run with with the fact Jesse a Human and produce implicit data', async () => {
        source.addQuad(
          quad(
            namedNode('http://example.org#Jesse'),
            namedNode('http://example.org#a'),
            namedNode('http://example.org#Human'),
          ),
        );

        const { execute } = await actor.run(action);
        await execute();
        expect(source).toBeRdfIsomorphic([quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        )]);
        expect(destination).toBeRdfIsomorphic([]);
        expect(data.dataset).toBeRdfIsomorphic([quad(
          namedNode('http://example.org#Human'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
        ), quad(
          namedNode('http://example.org#Class'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
        )]);
      });

      it('should run with with the facts Jesse a Human / human subset of thing and produce implicit data', async () => {
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
        )]);
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
