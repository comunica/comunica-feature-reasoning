import { ActorRdfReason } from '@comunica/bus-rdf-reason';
import { Bus } from '@comunica/core';
import { ActorRdfReasonConstructQuery } from '../lib/ActorRdfReasonConstructQuery';

describe('ActorRdfReasonConstructQuery', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfReasonConstructQuery instance', () => {
    let actor: ActorRdfReasonConstructQuery;

    beforeEach(() => {
      actor = new ActorRdfReasonConstructQuery({ name: 'actor', bus });
    });

    // TODO: IMPLEMENT THIS 
    it('should test', () => {
      return expect(actor.test({ })).resolves.toEqual(true); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ })).resolves.toMatchObject(true); // TODO
    });
  });
});
