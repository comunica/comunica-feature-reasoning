import { ActorOptimizeRule, IActionOptimizeRule, IActorOptimizeRuleOutput } from '@comunica/bus-optimize-rule';
import { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica actor that optimizes rules by filtering out those with false conclusions
 */
export class ActorOptimizeRuleRemoveFalseConclusion extends ActorOptimizeRule {
  public constructor(args: IActorArgs<IActionOptimizeRule, IActorTest, IActorOptimizeRuleOutput>) {
    super(args);
  }

  public async test(action: IActionOptimizeRule): Promise<IActorTest> {
    // console.log('test false conclusion', action.rules.length)
    return true; // TODO implement
  }

  public async run(action: IActionOptimizeRule): Promise<IActorOptimizeRuleOutput> {
    const rules = action.rules.filter(rule => rule.conclusion !== false)
    return { ...action, rules }; // TODO implement
  }
}
