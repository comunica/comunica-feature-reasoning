import { Bus } from '@comunica/core';
import { ActorRdfFilterExistingQuadsRdfjsSource } from '../lib/ActorRdfFilterExistingQuadsRdfjsSource';

describe('ActorRdfFilterExistingQuadsRdfjsSource', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfFilterExistingQuadsRdfjsSource instance', () => {
    let actor: ActorRdfFilterExistingQuadsRdfjsSource;

    beforeEach(() => {
      actor = new ActorRdfFilterExistingQuadsRdfjsSource({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
