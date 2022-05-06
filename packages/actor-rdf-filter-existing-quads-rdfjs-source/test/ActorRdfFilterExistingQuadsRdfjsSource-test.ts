import { ActionContext, Bus } from '@comunica/core';
import { ActorRdfFilterExistingQuadsRdfjsSource } from '../lib/ActorRdfFilterExistingQuadsRdfjsSource';
import { Store } from 'n3';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';

describe('ActorRdfFilterExistingQuadsRdfjsSource', () => {
  let bus: any;
  let store: Store;
  let context: ActionContext;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    store = new Store();
    context = new ActionContext({
      [KeysRdfResolveQuadPattern.source.name]: store,
    });
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
