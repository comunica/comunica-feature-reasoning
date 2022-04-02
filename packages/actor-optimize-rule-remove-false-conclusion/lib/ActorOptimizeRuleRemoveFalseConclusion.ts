import type { IActorOptimizeRuleArgs } from '@comunica/bus-optimize-rule';
import { ActorOptimizeRuleTyped } from '@comunica/bus-optimize-rule';
import type { Rule } from '@comunica/reasoning-types';
import type { AsyncIterator } from 'asynciterator';

/**
 * A comunica actor that optimizes rules by filtering out those with false conclusions
 */
export class ActorOptimizeRuleRemoveFalseConclusion extends ActorOptimizeRuleTyped {
  public constructor(args: IActorOptimizeRuleArgs) {
    super(args);
  }

  public optimizeRule(rules: AsyncIterator<Rule>): AsyncIterator<Rule> {
    return rules.filter(rule => rule.conclusion !== false);
  }
}
