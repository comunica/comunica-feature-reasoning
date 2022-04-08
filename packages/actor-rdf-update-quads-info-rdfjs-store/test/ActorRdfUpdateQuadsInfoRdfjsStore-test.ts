import { Bus } from '@comunica/core';
import { ActorRdfUpdateQuadsInfoRdfjsStore } from '../lib/ActorRdfUpdateQuadsInfoRdfjsStore';

describe('ActorRdfUpdateQuadsInfoRdfjsStore', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsInfoRdfjsStore instance', () => {
    let actor: ActorRdfUpdateQuadsInfoRdfjsStore;

    beforeEach(() => {
      actor = new ActorRdfUpdateQuadsInfoRdfjsStore({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
