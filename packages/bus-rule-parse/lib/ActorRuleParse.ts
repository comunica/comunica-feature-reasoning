import type { IActionAbstractMediaTyped,
  IActionAbstractMediaTypedHandle, IActionAbstractMediaTypedMediaTypes,
  IActorOutputAbstractMediaTyped,
  IActorOutputAbstractMediaTypedHandle, IActorOutputAbstractMediaTypedMediaTypes,
  IActorTestAbstractMediaTyped,
  IActorTestAbstractMediaTypedHandle,
  IActorTestAbstractMediaTypedMediaTypes } from '@comunica/actor-abstract-mediatyped';
import type { IActionParse, IActorParseOutput } from '@comunica/actor-abstract-parse';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { Actor } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import type * as RDF from '@rdfjs/types';

/**
 * A comunica actor for parsing reasoning rules
 *
 * Actor types:
 * * Input:  IActionRuleParse:      A parse input or a media type input.
 * * Test:   <none>
 * * Output: IActorRuleParseOutput: The parsed rules.
 *
 * @see IActionRuleParse
 * @see IActorRuleParseOutput
 */
export abstract class ActorRuleParse extends Actor<IActionRuleParse, IActorTest, IActorRuleParseOutput> {
  /**
   * @param args - @defaultNested {<default_bus> a <cc:components/Bus.jsonld#Bus>} bus
   */
  public constructor(args: IActorArgs<IActionRuleParse, IActorTest, IActorRuleParseOutput>) {
    super(args);
  }
}

export type IActionRootRuleParse = IActionAbstractMediaTyped<IActionRuleParse>;
export type IActorTestRootRuleParse = IActorTestAbstractMediaTyped<IActorTest>;
export type IActorOutputRootRuleParse = IActorOutputAbstractMediaTyped<IActorRuleParseOutput>;

export type IActionHandleRuleParse = IActionAbstractMediaTypedHandle<IActionRuleParse>;
export type IActorTestHandleRuleParse = IActorTestAbstractMediaTypedHandle<IActorTest>;
export type IActorOutputHandleRuleParse = IActorOutputAbstractMediaTypedHandle<IActorRuleParseOutput>;

export type IActionMediaTypesRuleParse = IActionAbstractMediaTypedMediaTypes;
export type IActorTestMediaTypesRuleParse = IActorTestAbstractMediaTypedMediaTypes;
export type IActorOutputMediaTypesRuleParse = IActorOutputAbstractMediaTypedMediaTypes;

export interface IActionRuleParseMetadata {
  /**
   * The base IRI for parsed rules.
   */
  baseIRI: string;
}

export type IActorRuleParseOutputMetadata = undefined;

export type IActionRuleParse = IActionParse<IActionRuleParseMetadata>;

export type IActorRuleParseOutput = IActorParseOutput<RDF.ResultStream<Rule>, IActorRuleParseOutputMetadata>;
