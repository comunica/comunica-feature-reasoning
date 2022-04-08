import { Bus } from '@comunica/core';
import { ActorRdfUpdateQuadsInfoDelegated } from '../lib/ActorRdfUpdateQuadsInfoDelegated';

describe('ActorRdfUpdateQuadsInfoDelegated', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsInfoDelegated instance', () => {
    let actor: ActorRdfUpdateQuadsInfoDelegated;

    beforeEach(() => {
      actor = new ActorRdfUpdateQuadsInfoDelegated({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
