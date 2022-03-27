import type {
  IActionDereferenceParse,
  IActorDereferenceParseArgs,
  IActorDereferenceParseOutput,
} from '@comunica/bus-dereference';
import {
  ActorDereferenceParse,
} from '@comunica/bus-dereference';
import type { IActionRuleParseMetadata, IActorRuleParseOutputMetadata, RuleStream } from '@comunica/bus-rule-parse';
import type { Mediate } from '@comunica/core';
import type * as RDF from '@rdfjs/types';
import type { Rule } from '@comunica/reasoning-types';

/**
 * A base actor for dereferencing URLs to rule streams.
 *
 * Actor types:
 * * Input:  IActionDereferenceRule:      A URL.
 * * Test:   <none>
 * * Output: IActorDereferenceRuleOutput: A rule stream.
 *
 * @see IActionDereferenceRule
 * @see IActorDereferenceRuleOutput
 */
export abstract class ActorDereferenceRule extends
  ActorDereferenceParse<RuleStream, IActionRuleParseMetadata, IActorRuleParseOutputMetadata> {
  /**
   * @param args - @defaultNested {<default_bus> a <cc:components/Bus.jsonld#Bus>} bus
   */
  public constructor(args: IActorDereferenceRuleArgs) {
    super(args);
  }
}

export interface IActorDereferenceRuleArgs extends
  IActorDereferenceParseArgs<RuleStream, IActionRuleParseMetadata, IActorRuleParseOutputMetadata> {
}

export type IActionDereferenceRule = IActionDereferenceParse<IActionRuleParseMetadata>;

export type IActorDereferenceRuleOutput =
IActorDereferenceParseOutput<RDF.ResultStream<Rule>, IActionRuleParseMetadata>;

export type MediatorDereferenceRule = Mediate<IActionDereferenceRule, IActorDereferenceRuleOutput>;
