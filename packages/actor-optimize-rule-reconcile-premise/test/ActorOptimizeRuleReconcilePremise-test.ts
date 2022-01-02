import { ActorOptimizeRule } from '@comunica/bus-optimize-rule';
import { Bus } from '@comunica/core';
import { ActorOptimizeRuleReconcilePremise } from '../lib/ActorOptimizeRuleReconcilePremise';

describe('ActorOptimizeRuleReconcilePremise', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorOptimizeRuleReconcilePremise instance', () => {
    let actor: ActorOptimizeRuleReconcilePremise;

    beforeEach(() => {
      actor = new ActorOptimizeRuleReconcilePremise({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
