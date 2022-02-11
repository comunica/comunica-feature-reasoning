import { Bus } from '@comunica/core';
import { ActorRdfUpdateQuadsInterceptReasoned } from '../lib/ActorRdfUpdateQuadsInterceptReasoned';

describe('ActorRdfUpdateQuadsInterceptReasoned', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsInterceptReasoned instance', () => {
    let actor: ActorRdfUpdateQuadsInterceptReasoned;

    beforeEach(() => {
      actor = new ActorRdfUpdateQuadsInterceptReasoned({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
