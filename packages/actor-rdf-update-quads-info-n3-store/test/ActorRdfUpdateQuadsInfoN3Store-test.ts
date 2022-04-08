import { Bus } from '@comunica/core';
import { ActorRdfUpdateQuadsInfoN3Store } from '../lib/ActorRdfUpdateQuadsInfoN3Store';

describe('ActorRdfUpdateQuadsInfoN3Store', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsInfoN3Store instance', () => {
    let actor: ActorRdfUpdateQuadsInfoN3Store;

    beforeEach(() => {
      actor = new ActorRdfUpdateQuadsInfoN3Store({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
