import { ActorRdfResolveQuadPattern, IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput } from '@comunica/bus-rdf-resolve-quad-pattern';
import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfResolveQuadPatternReasoned } from '../lib/ActorRdfResolveQuadPatternReasoned';
import { quad, namedNode, variable } from '@rdfjs/data-model'
import { KeysRdfResolveQuadPattern, } from '@comunica/context-entries'
import * as RDF from 'rdf-js';
import { union, wrap } from 'asynciterator';
import { Store } from 'n3';
import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput } from '@comunica/bus-rdf-reason';
import arrayifyStream = require('arrayify-stream')
import 'jest-rdf';
// converts an asynciterator to an array

describe('ActorRdfResolveQuadPatternReasoned', () => {
  let bus: any;
  let mediatorRdfResolveQuadPattern: any;
  let mediatorRdfReason: any;

  beforeEach(() => {
    mediatorRdfResolveQuadPattern = {
      async mediate(action: IActionRdfResolveQuadPattern): Promise<IActorRdfResolveQuadPatternOutput> {
        const sources = action.context?.get(KeysRdfResolveQuadPattern.source) ? action.context?.get(KeysRdfResolveQuadPattern.source) : action.context?.get(KeysRdfResolveQuadPattern.sources);
        const toUndef = (term: RDF.Term) => term.termType === 'Variable' ? undefined : term
        return {
          data: union(sources.map((source: Store) => wrap(source.match(
            // @ts-ignore
            toUndef(action.pattern.subject),
            toUndef(action.pattern.predicate),
            toUndef(action.pattern.object),
            toUndef(action.pattern.graph),
          ))))
        }
      }
    }
    mediatorRdfReason = {
      async mediate(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
        const context = ActorRdfReason.getContext(action.context);
        const implicitSource = ActorRdfReason.getImplicitSource(context);
        // @ts-ignore
        implicitSource.addQuads(
          [
            quad(
              namedNode('http://example.org#class'),
              namedNode('http://example.org#a'),
              namedNode('http://example.org#class')
            ),
            quad(
              namedNode('http://example.org#human'),
              namedNode('http://example.org#a'),
              namedNode('http://example.org#class')
            ),
            quad(
              namedNode('http://example.org#jesse'),
              namedNode('http://example.org#domain'),
              namedNode('http://example.org#human')
            ),
          ]
        )
        
        return { implicitSource }
      }
    }
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfResolveQuadPatternReasoned instance', () => {
    let actor: ActorRdfResolveQuadPatternReasoned;

    beforeEach(() => {
      actor = new ActorRdfResolveQuadPatternReasoned({
        name: 'actor',
        bus,
        mediatorRdfResolveQuadPattern,
        mediatorRdfReason
       });
    });

    it('should test', () => {
      return expect(actor.test({
        pattern: quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?o'),
        )
      })).resolves.toEqual(true); // TODO
    });

    it('should run', async () => {
      const source = new Store();
      source.addQuads([
        quad(
          namedNode('http://example.org#jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#human')
        ),
        quad(
          namedNode('http://example.org#jesse'),
          namedNode('http://example.org#knows'),
          namedNode('http://example.org#bob')
        ),
      ])
      const { data } = await actor.run({
        pattern: quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?o'),
        ),
        context: ActionContext({
          [KeysRdfResolveQuadPattern.source]: source
        })
      });
      const results: RDF.Quad[] = []
      data.on('data', q => { results.push(q) })
      await new Promise<void>((res, rej) => {
        data.on('end', () => { res() })
      })
      expect(results).toEqualRdfQuadArray([
        quad(
          namedNode('http://example.org#jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#human')
        ),
        quad(
          namedNode('http://example.org#class'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#class')
        ),
        quad(
          namedNode('http://example.org#human'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#class')
        ),
      ])

      // return expect(actor.run({
      //   pattern: quad(
      //     variable('?s'),
      //     namedNode('http://example.org#a'),
      //     variable('?o'),
      //   ),
      //   context: ActionContext({
      //     [KeysRdfResolveQuadPattern.source]: source
      //   })
      // })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
