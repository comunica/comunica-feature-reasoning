import { ActorNormalizeRule } from '@comunica/bus-normalize-rule';
import { Bus } from '@comunica/core';
import { ActorNormalizeRuleVariable } from '../lib/ActorNormalizeRuleVariable';

describe('ActorNormalizeRuleVariable', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorNormalizeRuleVariable instance', () => {
    let actor: ActorNormalizeRuleVariable;

    beforeEach(() => {
      actor = new ActorNormalizeRuleVariable({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
