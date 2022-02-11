import type { Rule } from '@comunica/bus-rule-parse';
import type { IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';
import { Actor } from '@comunica/core';
import type { ActionContext } from '@comunica/types';
import type { Algebra } from 'sparqlalgebrajs';

/**
 * A comunica actor for optimizing reasoning rules
 *
 * Actor types:
 * * Input:  IActionOptimizeRule:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorOptimizeRuleOutput: TODO: fill in.
 *
 * @see IActionOptimizeRule
 * @see IActorOptimizeRuleOutput
 */
export abstract class ActorOptimizeRule extends Actor<IActionOptimizeRule, IActorTest, IActorOptimizeRuleOutput> {
  public constructor(args: IActorArgs<IActionOptimizeRule, IActorTest, IActorOptimizeRuleOutput>) {
    super(args);
  }
}

export interface IActionOptimizeRule extends IAction {
  rules: Rule[];
  /**
   * An optional pattern to to restrict the rules to infer for
   */
  pattern?: Algebra.Pattern;
}

export interface IActorOptimizeRuleOutput extends IActorOutput {
  rules: Rule[];
  pattern?: Algebra.Pattern;
  context?: ActionContext;
}

export type MediatorOptimizeRule = Mediate<IActionOptimizeRule, IActorOptimizeRuleOutput>;
