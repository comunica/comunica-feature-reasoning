import type { IActorTest } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import type { AsyncIterator } from 'asynciterator';
import type { IActionOptimizeRule, IActorOptimizeRuleArgs, IActorOptimizeRuleOutput } from './ActorOptimizeRule';
import { ActorOptimizeRule } from './ActorOptimizeRule';

export abstract class ActorOptimizeRuleTyped<R extends Rule = Rule> extends ActorOptimizeRule {
  public constructor(args: IActorOptimizeRuleArgs) {
    super(args);
  }

  // Abstract testRule(rules: AsyncIterator<Rule>): rules is AsyncIterator<Rule>;

  public abstract optimizeRule(rules: AsyncIterator<R>): AsyncIterator<R>;

  public async test(action: IActionOptimizeRule): Promise<IActorTest> {
    return true;
    // Return this.testRule(action.rules.clone());
  }

  public async run(action: IActionOptimizeRule): Promise<IActorOptimizeRuleOutput> {
    return { ...action, rules: this.optimizeRule(<AsyncIterator<R>> action.rules) };
  }
}
