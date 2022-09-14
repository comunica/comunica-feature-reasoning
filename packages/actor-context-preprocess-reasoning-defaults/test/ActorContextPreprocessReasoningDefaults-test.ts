import { ActionContext, Bus } from '@comunica/core';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { Store } from 'n3';
import { ActorContextPreprocessReasoningDefaults } from '../lib/ActorContextPreprocessReasoningDefaults';

describe('ActorContextPreprocessReasoningDefaults', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorContextPreprocessReasoningDefaults instance', () => {
    let actor: ActorContextPreprocessReasoningDefaults;

    beforeEach(() => {
      actor = new ActorContextPreprocessReasoningDefaults({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ context: new ActionContext() })).resolves.toEqual(true);
    });

    it('should use N3Store default when no implicitDatasetFactory is available', async() => {
      const { context } = await actor.run({ context: new ActionContext() });
      const factory = context.getSafe<() => any>(KeysRdfReason.implicitDatasetFactory)();
      expect(factory).toBeInstanceOf(Store);
    });

    it('should use N3Store when implicitDatasetFactory is store input', async() => {
      const { context } = await actor.run({ context: new ActionContext({
        [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
      }) });
      const factory = context.getSafe<() => any>(KeysRdfReason.implicitDatasetFactory)();
      expect(factory).toBeInstanceOf(Store);
    });

    it('should use string when implicitDatasetFactory is string input', async() => {
      const { context } = await actor.run({ context: new ActionContext({
        [KeysRdfReason.implicitDatasetFactory.name]: () => 'http://example.org',
      }) });
      const factory = context.getSafe<() => any>(KeysRdfReason.implicitDatasetFactory)();
      expect(factory).toEqual('http://example.org');
    });
  });
});
