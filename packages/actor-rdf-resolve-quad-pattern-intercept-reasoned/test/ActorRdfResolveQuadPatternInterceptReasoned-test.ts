import { implicitGroupFactory, KeysRdfReason, MediatorRdfReason, reasonGroupContext } from '@comunica/bus-rdf-reason';
import { MediatorRdfResolveQuadPatternIntercept } from '@comunica/bus-rdf-resolve-quad-pattern-intercept';
import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfResolveQuadPatternInterceptReasoned } from '../lib/ActorRdfResolveQuadPatternInterceptReasoned';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries'
import { Store, DataFactory } from 'n3';
import { AsyncIterator, fromArray, union, UnionIterator, wrap } from 'asynciterator';
import { IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput } from '@comunica/bus-rdf-resolve-quad-pattern'
import * as RDF from '@rdfjs/types';
import { Algebra, Factory } from 'sparqlalgebrajs';
const { namedNode, quad, variable } = DataFactory;

function getDataStream(store: Store, pattern: Algebra.Pattern): AsyncIterator<RDF.Quad> {
  const u = (term: RDF.Term) => term.termType === 'Variable' ? undefined : term;
  return wrap<RDF.Quad>(store.match(
    // @ts-ignore
    u(pattern.subject), u(pattern.predicate), u(pattern.object), u(pattern.graph)
  ), { autoStart: false });
}

const factory = new Factory();

describe('ActorRdfResolveQuadPatternInterceptReasoned', () => {
  let bus: any;
  let mediatorRdfReason: MediatorRdfReason;
  let mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPatternIntercept;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    // @ts-ignore
    mediatorRdfReason = {
      async mediate(action) {
        return { execute: async () => { } }
      }
    }
    // @ts-ignore
    mediatorRdfResolveQuadPattern = {
      async mediate(action: IActionRdfResolveQuadPattern): Promise<IActorRdfResolveQuadPatternOutput> {
        // console.log('mediatorRdfResolveQuadPAttern called', action)
        if (action.context.has(KeysRdfResolveQuadPattern.source)) {
          const source: Store = action.context.get(KeysRdfResolveQuadPattern.source)!;
          const data = getDataStream(source, action.pattern);
          return { data };
        }
        const sources: Store[] = action.context.get(KeysRdfResolveQuadPattern.sources)!;
        // console.log('trying to resolve sources', sources)
        return { data: new UnionIterator(fromArray(sources).map((source: Store) => getDataStream(source, action.pattern)), { autoStart: false }) };
      }
    }
  });

  describe('An ActorRdfResolveQuadPatternInterceptReasoned instance', () => {
    let actor: ActorRdfResolveQuadPatternInterceptReasoned;
    let source1: Store;
    let source2: Store;
    let action: IActionRdfResolveQuadPattern;
    let actionMultiSource: IActionRdfResolveQuadPattern;

    beforeEach(() => {
      actor = new ActorRdfResolveQuadPatternInterceptReasoned({
        name: 'actor',
        bus,
        mediatorRdfReason,
        mediatorRdfResolveQuadPattern,
      });

      const pattern = factory.createPattern(
        variable('?s'),
        variable('?p'),
        variable('?o'),
        variable('?g'),
      );

      source1 = new Store([
        quad(
          namedNode("http://example.org#Jesse"),
          namedNode("http://example.org#a"),
          namedNode("http://example.org#Person"),
        )
      ]);

      source2 = new Store([
        quad(
          namedNode("http://example.org#Jesse"),
          namedNode("http://example.org#a"),
          namedNode("http://example.org#Thing"),
        )
      ]);

      const context = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: source1,
        [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
      });

      const contextMultiSource = new ActionContext({
        [KeysRdfResolveQuadPattern.sources.name]: [source1, source2],
        [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
      });

      action = { context, pattern }
      actionMultiSource = { context: contextMultiSource, pattern }
    });

    it('should test', () => {
      return expect(actor.test(action)).resolves.toEqual(true);
    });

    it('should run without implicit data', async () => {
      const { data } = await actor.run(action);
      expect(await data.toArray()).toEqual([
        quad(
          namedNode("http://example.org#Jesse"),
          namedNode("http://example.org#a"),
          namedNode("http://example.org#Person"),
        )
      ]);
    });

    it('should run with implicit data', async () => {
      const { data } = await actor.run({
        ...action, context: action.context.set(KeysRdfReason.data, {
          dataset: new Store([
            quad(
              namedNode("http://example.org#Jesse"),
              namedNode("http://example.org#a"),
              namedNode("http://example.org#Agent"),
            )
          ])
        })
      });

      expect(await data.toArray()).toEqual([
        quad(
          namedNode("http://example.org#Jesse"),
          namedNode("http://example.org#a"),
          namedNode("http://example.org#Person"),
        ),
        quad(
          namedNode("http://example.org#Jesse"),
          namedNode("http://example.org#a"),
          namedNode("http://example.org#Agent"),
        )
      ]);
    });


    it('should test (multiple sources)', () => {
      return expect(actor.test(actionMultiSource)).resolves.toEqual(true);
    });

    it('should run without implicit data (multiple sources)', async () => {
      const { data } = await actor.run(actionMultiSource);
      expect(await data.toArray()).toEqual([
        quad(
          namedNode("http://example.org#Jesse"),
          namedNode("http://example.org#a"),
          namedNode("http://example.org#Person"),
        ),
        quad(
          namedNode("http://example.org#Jesse"),
          namedNode("http://example.org#a"),
          namedNode("http://example.org#Thing"),
        )
      ]);
    });

    it('should run with implicit data (multiple sources)', async () => {
      const { data } = await actor.run({
        ...action, context: actionMultiSource.context.set(KeysRdfReason.data, {
          dataset: new Store([
            quad(
              namedNode("http://example.org#Jesse"),
              namedNode("http://example.org#a"),
              namedNode("http://example.org#Agent"),
            )
          ])
        })
      });

      expect(await data.toArray()).toEqual([
        quad(
          namedNode("http://example.org#Jesse"),
          namedNode("http://example.org#a"),
          namedNode("http://example.org#Person"),
        ),
        quad(
          namedNode("http://example.org#Jesse"),
          namedNode("http://example.org#a"),
          namedNode("http://example.org#Thing"),
        ),
        quad(
          namedNode("http://example.org#Jesse"),
          namedNode("http://example.org#a"),
          namedNode("http://example.org#Agent"),
        )
      ]);
    });

  });
});
