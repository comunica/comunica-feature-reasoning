import { ActionContext, Bus } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import { fromArray } from 'asynciterator';
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
      return expect(actor.test({ rules: fromArray<Rule>([]), context: new ActionContext() })).resolves.toEqual(true);
    });

    it('should run on an empty ruleset', async() => {
      const { rules } = await actor.run({ rules: fromArray([]), context: new ActionContext() });
      expect(await rules.toArray()).toEqual([]);
    });

    it('should run on an empty normal rules', async() => {
      const { rules } = await actor.run({ rules: fromArray<Rule>([{
        ruleType: 'premise-conclusion',
        premise: [],
        conclusion: [],
      }]),
      context: new ActionContext() });
      expect(await rules.toArray()).toEqual([{
        ruleType: 'premise-conclusion',
        premise: [],
        conclusion: [],
      }]);
    });

    it('should run on rules with a false conclusion', async() => {
      const { rules } = await actor.run({ rules: fromArray<Rule>([{
        ruleType: 'rdfs',
        premise: [],
        conclusion: false,
      }]),
      context: new ActionContext() });
      expect(await rules.toArray()).toEqual([]);
    });

    it('should run on rules with a mix of rules', async() => {
      const { rules } = await actor.run({ rules: fromArray<Rule>([{
        ruleType: 'premise-conclusion',
        premise: [],
        conclusion: [],
      }, {
        ruleType: 'rdfs',
        premise: [],
        conclusion: false,
      }]),
      context: new ActionContext() });
      expect(await rules.toArray()).toEqual([{
        ruleType: 'premise-conclusion',
        premise: [],
        conclusion: [],
      }]);
    });
  });
});
