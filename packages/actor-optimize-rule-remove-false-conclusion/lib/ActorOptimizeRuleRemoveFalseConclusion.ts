import type {
  IActionOptimizeRule, IActorOptimizeRuleArgs, IActorOptimizeRuleOutput,
} from '@comunica/bus-optimize-rule';
import { ActorOptimizeRule } from '@comunica/bus-optimize-rule';
import type { IActorTest } from '@comunica/core';

/**
 * A comunica actor that optimizes rules by filtering out those with false conclusions
 */
export class ActorOptimizeRuleRemoveFalseConclusion extends ActorOptimizeRule {
  public constructor(args: IActorOptimizeRuleArgs) {
    super(args);
  }

  public async test(action: IActionOptimizeRule): Promise<IActorTest> {
    // Console.log('test false conclusion', action.rules.length)
    return true;
  }

  public async run(action: IActionOptimizeRule): Promise<IActorOptimizeRuleOutput> {
    const rules = action.rules.filter(rule => rule.conclusion !== false);
    return { ...action, rules };
  }
}
