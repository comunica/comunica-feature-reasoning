import { IReasonGroup, KeysRdfReason } from '@comunica/bus-rdf-reason';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { mediatorRdfReason, mediatorRdfResolveQuadPattern, mediatorRdfUpdateQuads } from '@comunica/reasoning-mocks';
import { IActionContext } from '@comunica/types';
import { Store } from 'n3';
import { ActorRdfUpdateQuadsInterceptReasoned } from '../lib/ActorRdfUpdateQuadsInterceptReasoned';

describe('ActorRdfUpdateQuadsInterceptReasoned', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsInterceptReasoned instance', () => {
    let actor: ActorRdfUpdateQuadsInterceptReasoned;
    let source: Store;
    let destination: Store;
    let implicitDestination: Store;
    let reasonGroup: IReasonGroup;
    let context: IActionContext;

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
        mediatorRdfUpdateQuads
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

    it('should run', async () => {
      const { execute } = await actor.run({ context });
      await execute();
      expect(destination.getQuads(null, null, null, null)).toEqual([])
    });
  });
});
