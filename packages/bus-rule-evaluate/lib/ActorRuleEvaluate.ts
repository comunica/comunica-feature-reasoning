import { Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';
import { Rule } from '@comunica/reasoning-types';
import * as RDF from '@rdfjs/types';
import { AsyncIterator } from 'asynciterator';

/**
 * A comunica actor for performing single rule evaluations
 *
 * Actor types:
 * * Input:  IActionRuleEvaluate:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorRuleEvaluateOutput: TODO: fill in.
 *
 * @see IActionRuleEvaluate
 * @see IActorRuleEvaluateOutput
 */
export abstract class ActorRuleEvaluate extends Actor<IActionRuleEvaluate, IActorTest, IActorRuleEvaluateOutput> {
  public constructor(args: IActorArgs<IActionRuleEvaluate, IActorTest, IActorRuleEvaluateOutput>) {
    super(args);
  }
}

export interface IActionRuleEvaluate extends IAction {
  /**
   * The rule to evaluate
   */
  rule: Rule;
  /**
   * An (optional) stream of quads. If defined the actor should only produce
   * inferences where data from the stream forms part of the inference.
   */
  quadStream?: AsyncIterator<RDF.Quad>;
}

export interface IActorRuleEvaluateOutput extends IActorOutput {
  /**
   * The results of the rule evaluation
   */
  results: AsyncIterator<RDF.Quad>
}

export type IActorRuleEvaluateArgs = IActorArgs<
  IActionRuleEvaluate, IActorTest, IActorRuleEvaluateOutput>;

export type MediatorRuleEvaluate = Mediate<
  IActionRuleEvaluate, IActorRuleEvaluateOutput>;
