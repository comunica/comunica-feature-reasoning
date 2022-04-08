import { Bus } from '@comunica/core';
import { ActorRuleEvaluateConstructQuery } from '../lib/ActorRuleEvaluateConstructQuery';

describe('ActorRuleEvaluateConstructQuery', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRuleEvaluateConstructQuery instance', () => {
    let actor: ActorRuleEvaluateConstructQuery;

    beforeEach(() => {
      actor = new ActorRuleEvaluateConstructQuery({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
