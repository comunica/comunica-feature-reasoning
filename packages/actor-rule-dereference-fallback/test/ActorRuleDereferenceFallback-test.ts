import { Bus } from '@comunica/core';
import { ActorRuleDereferenceFallback } from '../lib/ActorRuleDereferenceFallback';

describe('ActorRuleDereferenceFallback', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRuleDereferenceFallback instance', () => {
    let actor: ActorRuleDereferenceFallback;

    beforeEach(() => {
      actor = new ActorRuleDereferenceFallback({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
