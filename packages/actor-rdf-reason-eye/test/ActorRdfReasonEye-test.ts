import { Bus } from '@comunica/core';
import { ActorRdfReasonEye } from '../lib/ActorRdfReasonEye';

describe('ActorRdfReasonEye', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfReasonEye instance', () => {
    let actor: ActorRdfReasonEye;

    beforeEach(() => {
      actor = new ActorRdfReasonEye({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
