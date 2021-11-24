import { ActorRuleParse } from '@comunica/bus-rule-parse';
import { Bus } from '@comunica/core';
import { ActorRuleParseN3 } from '../lib/ActorRuleParseN3';

describe('ActorRuleParseN3', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRuleParseN3 instance', () => {
    let actor: ActorRuleParseN3;

    beforeEach(() => {
      actor = new ActorRuleParseN3({ name: 'actor', bus });
    });

    // TODO: IMPLEMENT THIS
    it('should test', () => {
      return expect(actor.test({ })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
