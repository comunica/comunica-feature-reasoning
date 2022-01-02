import { ActorOptimizeRuleDataAware, IActionOptimizeRuleDataAware, IActorOptimizeRuleDataAwareOutput } from '@comunica/bus-optimize-rule-data-aware';
import { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica actor that restricts rules based on whether appropriate premise patterns are available
 */
export class ActorOptimizeRuleDataAwarePatternRestriction extends ActorOptimizeRuleDataAware {
  public constructor(args: IActorArgs<IActionOptimizeRuleDataAware, IActorTest, IActorOptimizeRuleDataAwareOutput>) {
    super(args);
  }

  public async test(action: IActionOptimizeRuleDataAware): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionOptimizeRuleDataAware): Promise<IActorOptimizeRuleDataAwareOutput> {
    return true; // TODO implement
  }
}
