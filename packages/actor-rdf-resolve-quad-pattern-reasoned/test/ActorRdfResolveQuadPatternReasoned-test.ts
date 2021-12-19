import { ActorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import { Bus } from '@comunica/core';
import { ActorRdfResolveQuadPatternReasoned } from '../lib/ActorRdfResolveQuadPatternReasoned';

describe('ActorRdfResolveQuadPatternReasoned', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfResolveQuadPatternReasoned instance', () => {
    let actor: ActorRdfResolveQuadPatternReasoned;

    beforeEach(() => {
      actor = new ActorRdfResolveQuadPatternReasoned({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
