import type { IAction, IActorArgs, IActorOutput, IActorTest } from '@comunica/core';
import { Actor } from '@comunica/core';
import { ActorOptimizeRuleDataAware, IActionOptimizeRuleDataAware, IActorOptimizeRuleDataAwareOutput } from './ActorOptimizeRuleDataAware';
import {} from '@comunica/bus-rdf-resolve-quad-pattern'

/**
 * A comunica actor for optimize-rule-data-aware events.
 *
 * Actor types:
 * * Input:  IActionOptimizeRuleDataAware:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorOptimizeRuleDataAwareOutput: TODO: fill in.
 *
 * @see IActionOptimizeRuleDataAware
 * @see IActorOptimizeRuleDataAwareOutput
 */
export abstract class ActorOptimizeRuleDataAwareMediated extends ActorOptimizeRuleDataAware {
  // TODO: Sort mediation
  public constructor(args: IActorArgs<IActionOptimizeRuleDataAwareMediated, IActorTest, IActorOptimizeRuleDataAwareOutputMediated>) {
    super(args);
  }
}

export interface IActionOptimizeRuleDataAwareMediated extends IActionOptimizeRuleDataAware {

}

export interface IActorOptimizeRuleDataAwareOutputMediated extends IActorOptimizeRuleDataAwareOutput {

}

export interface IActorOptimizeRuleDataAwareMediatedArgs extends IActorArgs<IActionOptimizeRuleDataAwareMediated, IActorTest, IActorOptimizeRuleDataAwareOutputMediated> {

}
