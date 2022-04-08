import { Bus } from '@comunica/core';
import { ActorRdfUpdateQuadsInfoFederated } from '../lib/ActorRdfUpdateQuadsInfoFederated';

describe('ActorRdfUpdateQuadsInfoFederated', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsInfoFederated instance', () => {
    let actor: ActorRdfUpdateQuadsInfoFederated;

    beforeEach(() => {
      actor = new ActorRdfUpdateQuadsInfoFederated({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
