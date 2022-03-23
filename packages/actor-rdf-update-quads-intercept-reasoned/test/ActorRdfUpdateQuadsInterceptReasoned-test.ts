import type { IReasonGroup } from '@comunica/bus-rdf-reason';
import { KeysRdfReason } from '@comunica/bus-rdf-reason';
import type { IActionRdfUpdateQuadsIntercept } from '@comunica/bus-rdf-update-quads-intercept';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { mediatorRdfReason, mediatorRdfResolveQuadPattern, mediatorRdfUpdateQuads } from '@comunica/reasoning-mocks';
import type { IActionContext } from '@comunica/types';
import { namedNode, quad } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import { fromArray } from 'asynciterator';
import { Store } from 'n3';
import { ActorRdfUpdateQuadsInterceptReasoned } from '../lib/ActorRdfUpdateQuadsInterceptReasoned';

describe('ActorRdfUpdateQuadsInterceptReasoned', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsInterceptReasoned instance', () => {
    let actor: ActorRdfUpdateQuadsInterceptReasoned;
    let action: IActionRdfUpdateQuadsIntercept;
    let source: Store;
    let destination: Store;
    let implicitDestination: Store;
    let reasonGroup: IReasonGroup;
    let context: IActionContext;
    let execute: Function;
    let quads: RDF.Quad[];

    beforeEach(() => {
      source = new Store();
      destination = new Store();
      reasonGroup = {
        dataset: implicitDestination,
        status: { type: 'full', reasoned: false },
        context: new ActionContext(),
      };
      context = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: source,
        [KeysRdfUpdateQuads.destination.name]: destination,
        [KeysRdfReason.data.name]: reasonGroup,
      });

      actor = new ActorRdfUpdateQuadsInterceptReasoned({
        name: 'actor',
        bus,
        mediatorRdfReason,
        mediatorRdfResolveQuadPattern,
        mediatorRdfUpdateQuads,
      });
    });

    it('should test true if source and destination are provided', () => {
      return expect(actor.test({ context })).resolves.toEqual(true);
    });

    it('should reject if a destination is not provided provided', () => {
      return expect(actor.test({
        context: new ActionContext({
          [KeysRdfResolveQuadPattern.source.name]: source,
        }),
      })).rejects.toThrowError();
    });

    it('should run', async() => {
      const { execute } = await actor.run({ context });
      await execute();
      expect(destination.getQuads(null, null, null, null)).toEqual([]);
    });

    describe('Performing inserts', () => {
      beforeEach(async() => {
        action = {
          context,
          quadStreamInsert: fromArray([
            quad(namedNode('s'), namedNode('p'), namedNode('o'), namedNode('g')),
          ]),
        };

        execute = (await actor.run(action)).execute;
      });

      it('Should not have inserted the quad into the store prior to calling execute', () => {
        expect(destination.getQuads(null, null, null, null)).toBeRdfIsomorphic([]);
      });

      describe('Post running execute', () => {
        beforeEach(async() => {
          await execute();
        });

        it('Should have inserted the quad into the store', () => {
          expect(destination.getQuads(null, null, null, null)).toBeRdfIsomorphic([
            quad(namedNode('s'), namedNode('p'), namedNode('o'), namedNode('g')),
          ]);
        });
      });
    });

    describe('Performing deletes', () => {
      beforeEach(async() => {
        quads = [
          quad(namedNode('s'), namedNode('p'), namedNode('o'), namedNode('g')),
          quad(namedNode('s1'), namedNode('p'), namedNode('o'), namedNode('g')),
          quad(namedNode('s'), namedNode('p'), namedNode('o'), namedNode('g1')),
          quad(namedNode('s1'), namedNode('p'), namedNode('o'), namedNode('g1')),
        ];

        destination.addQuads(quads);
      });

      describe('Deleting a single quad', () => {
        beforeEach(async() => {
          action = {
            context,
            quadStreamDelete: fromArray([
              quad(namedNode('s'), namedNode('p'), namedNode('o'), namedNode('g')),
            ]),
          };

          execute = (await actor.run(action)).execute;
        });

        it('Should not have deleted the quads prior to calling execute', () => {
          expect(destination.getQuads(null, null, null, null)).toBeRdfIsomorphic(quads);
        });

        describe('Post running execute', () => {
          beforeEach(async() => {
            await execute();
          });

          it('Should have deleted the quad from the store', () => {
            expect(destination.getQuads(null, null, null, null)).toBeRdfIsomorphic([
              quad(namedNode('s1'), namedNode('p'), namedNode('o'), namedNode('g')),
              quad(namedNode('s'), namedNode('p'), namedNode('o'), namedNode('g1')),
              quad(namedNode('s1'), namedNode('p'), namedNode('o'), namedNode('g1')),
            ]);
          });
        });
      });

      describe('Deleting a graph', () => {
        beforeEach(async() => {
          action = {
            context,
            deleteGraphs: {
              graphs: [ namedNode('g') ],
              requireExistence: true,
              dropGraphs: true,
            },
          };

          execute = (await actor.run(action)).execute;
        });

        it('Should not have deleted the quads prior to calling execute', () => {
          expect(destination.getQuads(null, null, null, null)).toBeRdfIsomorphic(quads);
        });

        describe('Post running execute', () => {
          beforeEach(async() => {
            await execute();
          });

          it('Should have deleted all quads from the graph quad from the store', () => {
            expect(destination.getQuads(null, null, null, null)).toBeRdfIsomorphic([
              quad(namedNode('s'), namedNode('p'), namedNode('o'), namedNode('g1')),
              quad(namedNode('s1'), namedNode('p'), namedNode('o'), namedNode('g1')),
            ]);
          });
        });
      });
    });
  });
});
