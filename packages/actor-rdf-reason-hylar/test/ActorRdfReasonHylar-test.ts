import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput, KeysRdfReason } from '@comunica/bus-rdf-reason';
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries'
import { ActionContext, Bus } from '@comunica/core';
import { IDataDestination, IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput } from '@comunica/bus-rdf-update-quads';
import { IDataSource, IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput } from '@comunica/bus-rdf-resolve-quad-pattern';
import { ActorRdfReasonHylar } from '../lib/ActorRdfReasonHylar';
import { fromArray, empty, wrap, union } from 'asynciterator'
import { Store } from 'n3';
import { namedNode, quad, variable } from '@rdfjs/data-model';
import type { EventEmitter } from 'events';
import * as RDF from '@rdfjs/types'
import 'jest-rdf';
type Data = IDataDestination & IDataSource

function awaitEvent(event: EventEmitter) {
  return new Promise<void>((res, rej) => {
    event.on('end', () => { res() });
    // event.on('finish', () => { res() });
    event.on('err', (e) => { rej(e) })
    // event.emit
  })
}

describe('ActorRdfReasonHylar', () => {
  let bus: any;
  let mediatorRdfUpdateQuads: any;
  let mediatorRdfResolveQuadPattern: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    mediatorRdfUpdateQuads = {
      async mediate(action: IActionRdfUpdateQuads): Promise<IActorRdfUpdateQuadsOutput> {
        const destination = action.context?.get(KeysRdfUpdateQuads.destination);
        await awaitEvent(destination?.import(action.quadStreamInsert));

        // action.quadStreamInsert

        // destination.addQuad()

        return {
          updateResult: Promise.resolve(),
        };
      }
    };
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
        // const destination
      }
    };
  });

  describe('An ActorRdfReasonHylar instance', () => {
    let actor: ActorRdfReasonHylar;

    beforeEach(() => {
      actor = new ActorRdfReasonHylar({
        name: 'actor',
        bus,
        mediatorRdfUpdateQuads,
        mediatorRdfResolveQuadPattern
      });
    });

    // TODO: Implement this
    it('should test', () => {
      return expect(actor.test({
        context: ActionContext({
          // TODO: Probably rename this to destination
          [KeysRdfReason.dataset]: new Store(),
          [KeysRdfUpdateQuads.destination]: new Store(),
          [KeysRdfResolveQuadPattern.source]: new Store()
        }),
        settings: {
          sourceReasoned: false,
          rules: [],
          lazy: false
        },
        updates: {
          quadStreamInsert: fromArray([]),
          quadStreamDelete: fromArray([]),
        }
      })).resolves.toEqual(true); // TODO
    });

    it('should run with no rules and empty data', () => {
      const input: IActionRdfReason = {
        context: ActionContext({
          [KeysRdfReason.dataset]: new Store(),
          [KeysRdfUpdateQuads.destination]: new Store(),
          [KeysRdfResolveQuadPattern.source]: new Store()
        }),
        settings: {
          sourceReasoned: false,
          rules: [],
          lazy: false
        },
        updates: {
          quadStreamInsert: fromArray([]),
          quadStreamDelete: fromArray([]),
        }
      }
      return expect(actor.run(input)).resolves.toMatchObject<IActorRdfReasonOutput>({
        implicitSource: new Store(),
      });
    });

    it('should run with no rules and empty data', async () => {
      const dataset = new Store();
      const destination = new Store();
      const source = new Store();

      source.addQuad(
        quad(
          namedNode('http://example.org#Jesse'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Human'),
        )
      )

      const input: IActionRdfReason = {
        context: ActionContext({
          [KeysRdfReason.dataset]: dataset,
          [KeysRdfUpdateQuads.destination]: destination,
          [KeysRdfResolveQuadPattern.source]: source
        }),
        settings: {
          sourceReasoned: true,
          rules: [
            {
              premise: [
                quad(
                  variable('?s'),
                  namedNode('http://example.org#a'),
                  variable('?o')
                )
              ],
              conclusion: [
                quad(
                  variable('?o'),
                  namedNode('http://example.org#a'),
                  namedNode('http://example.org#class')
                )
              ]
            }
          ],
          lazy: false
        },
        updates: {
          quadStreamInsert: fromArray([]),
          quadStreamDelete: fromArray([]),
        }
      }
      const { implicitSource } = await actor.run(input);
      expect(source).toBeRdfIsomorphic([quad(
        namedNode('http://example.org#Jesse'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#Human'),
      )])
      expect(destination).toBeRdfIsomorphic([])
      expect(dataset).toBeRdfIsomorphic([quad(
        namedNode('http://example.org#Human'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#class'),
      ),quad(
        namedNode('http://example.org#class'),
        namedNode('http://example.org#a'),
        namedNode('http://example.org#class'),
      )])
      expect(implicitSource).toBe(dataset);
      // return expect(actor.run(input)).resolves.toMatchObject<IActorRdfReasonOutput>({
      //   implicitSource: new Store(),
      // });
    });
  });
});
