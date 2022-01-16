import { ActorInit } from '@comunica/bus-init';
import { Bus } from '@comunica/core';
import { ActorInitReasoning } from '../lib/ActorInitReasoning';

describe('ActorInitReasoning', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorInitReasoning instance', () => {
    let actor: ActorInitReasoning;

    beforeEach(() => {
      actor = new ActorInitReasoning({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
