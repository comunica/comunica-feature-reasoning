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

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
