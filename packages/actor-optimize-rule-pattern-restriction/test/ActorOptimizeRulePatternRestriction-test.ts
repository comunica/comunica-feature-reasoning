import { Bus } from '@comunica/core';
import { ActorOptimizeRulePatternRestriction } from '../lib/ActorOptimizeRulePatternRestriction';

describe('ActorOptimizeRulePatternRestriction', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorOptimizeRulePatternRestriction instance', () => {
    let actor: ActorOptimizeRulePatternRestriction;

    beforeEach(() => {
      actor = new ActorOptimizeRulePatternRestriction({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
