import { ActorInit } from '@comunica/bus-init';
import { Bus } from '@comunica/core';
import { ActorInitSparqlReasoning } from '../lib/ActorInitSparqlReasoning';

describe('ActorInitSparqlReasoning', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorInitSparqlReasoning instance', () => {
    let actor: ActorInitSparqlReasoning;

    beforeEach(() => {
      actor = new ActorInitSparqlReasoning({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
