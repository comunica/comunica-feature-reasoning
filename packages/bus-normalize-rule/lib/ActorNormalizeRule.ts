import { Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediator } from '@comunica/core';
import { Rule } from '@comunica/bus-rule-parse';

/**
 * A comunica actor that performs a normalizing action on reasoning rules
 *
 * Actor types:
 * * Input:  IActionNormalizeRule:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorNormalizeRuleOutput: TODO: fill in.
 *
 * @see IActionNormalizeRule
 * @see IActorNormalizeRuleOutput
 */
export abstract class ActorNormalizeRule extends Actor<IActionNormalizeRule, IActorTest, IActorNormalizeRuleOutput> {
  public constructor(args: IActorArgs<IActionNormalizeRule, IActorTest, IActorNormalizeRuleOutput>) {
    super(args);
  }
}

export interface IActionNormalizeRule extends IAction {
  rules: Rule[];
}

export interface IActorNormalizeRuleOutput extends IActorOutput {
  rules: Rule[];
}

export type MediatorNormalizeRule = Mediator<Actor<IActionNormalizeRule, IActorTest, IActorNormalizeRuleOutput>, IActionNormalizeRule, IActorTest, IActorNormalizeRuleOutput>
