import { ActorOptimizeRuleDataAware } from '@comunica/bus-optimize-rule-data-aware';
import { Bus } from '@comunica/core';
import { ActorOptimizeRuleDataAwarePatternRestriction } from '../lib/ActorOptimizeRuleDataAwarePatternRestriction';

describe('ActorOptimizeRuleDataAwarePatternRestriction', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorOptimizeRuleDataAwarePatternRestriction instance', () => {
    let actor: ActorOptimizeRuleDataAwarePatternRestriction;

    beforeEach(() => {
      actor = new ActorOptimizeRuleDataAwarePatternRestriction({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
