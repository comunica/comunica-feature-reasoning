import { Bus } from '@comunica/core';
import { ActorRdfReasonConstructQuery } from '../lib/ActorRdfReasonConstructQuery';

describe('ActorRdfReasonConstructQuery', () => {
  let bus: any;
  let mediatorQueryOperation: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    mediatorQueryOperation = {
      async mediator() {
        return {
          updateResult: Promise.resolve(),
        }
      }
    }
  });

  describe('An ActorRdfReasonConstructQuery instance', () => {
    let actor: ActorRdfReasonConstructQuery;

    beforeEach(() => {
      actor = new ActorRdfReasonConstructQuery({
        name: 'actor',
        bus,
        mediatorQueryOperation
      });
    });

    // TODO: IMPLEMENT THIS 
    it('should test', () => {
      return expect(actor.test({ 
        settings: {
          sourceReasoned: false,
          lazy: false,
          rules: []
        },
        updates: {}
       })).resolves.toEqual(true); // TODO
    });

    it('should run', async () => {
      const { implicitSource } = await actor.run({ 
        settings: {
          sourceReasoned: false,
          lazy: false,
          rules: []
        },
        updates: {}
       })
       // @ts-ignore
       expect(implicitSource.size).toEqual(0);
      // return expect(actor.run({ })).resolves.toMatchObject(true); // TODO
    });
  });
});
