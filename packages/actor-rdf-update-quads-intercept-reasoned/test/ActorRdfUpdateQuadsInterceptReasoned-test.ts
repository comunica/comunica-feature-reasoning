import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfUpdateQuadsInterceptReasoned } from '../lib/ActorRdfUpdateQuadsInterceptReasoned';

describe('ActorRdfUpdateQuadsInterceptReasoned', () => {
  let bus: Bus;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsInterceptReasoned instance', () => {
    let actor: ActorRdfUpdateQuadsInterceptReasoned;

    beforeEach(() => {
      actor = new ActorRdfUpdateQuadsInterceptReasoned({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ context: new ActionContext() })).resolves.toEqual(true); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ context: new ActionContext() })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
