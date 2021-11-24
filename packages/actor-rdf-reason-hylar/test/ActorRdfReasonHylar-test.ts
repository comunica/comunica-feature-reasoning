import { ActorRdfReason } from '@comunica/bus-rdf-reason';
import { Bus } from '@comunica/core';
import { ActorRdfReasonHylar } from '../lib/ActorRdfReasonHylar';

describe('ActorRdfReasonHylar', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfReasonHylar instance', () => {
    let actor: ActorRdfReasonHylar;

    beforeEach(() => {
      actor = new ActorRdfReasonHylar({ name: 'actor', bus });
    });

    // TODO: Implement this
    it('should test', () => {
      return expect(actor.test({ })).resolves.toEqual(true); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ })).resolves.toMatchObject(true); // TODO
    });
  });
});
