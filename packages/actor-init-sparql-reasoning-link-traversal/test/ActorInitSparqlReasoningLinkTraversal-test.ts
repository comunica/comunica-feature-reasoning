import { ActorInit } from '@comunica/bus-init';
import { Bus } from '@comunica/core';
import { ActorInitSparqlReasoningLinkTraversal } from '../lib/ActorInitSparqlReasoningLinkTraversal';

describe('ActorInitSparqlReasoningLinkTraversal', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorInitSparqlReasoningLinkTraversal instance', () => {
    let actor: ActorInitSparqlReasoningLinkTraversal;

    beforeEach(() => {
      actor = new ActorInitSparqlReasoningLinkTraversal({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
