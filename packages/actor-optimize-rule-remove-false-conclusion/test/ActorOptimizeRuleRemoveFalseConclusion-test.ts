import { ActorOptimizeRule } from '@comunica/bus-optimize-rule';
import { Bus } from '@comunica/core';
import { ActorOptimizeRuleRemoveFalseConclusion } from '../lib/ActorOptimizeRuleRemoveFalseConclusion';

describe('ActorOptimizeRuleRemoveFalseConclusion', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorOptimizeRuleRemoveFalseConclusion instance', () => {
    let actor: ActorOptimizeRuleRemoveFalseConclusion;

    beforeEach(() => {
      actor = new ActorOptimizeRuleRemoveFalseConclusion({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
