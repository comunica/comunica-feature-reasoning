import type { IActorArgsMediaTypedFixed } from '@comunica/actor-abstract-mediatyped';
import { ActorAbstractMediaTypedFixed } from '@comunica/actor-abstract-mediatyped';
import type { IActorTest } from '@comunica/core';
import type { IActionRuleParse, IActorRuleParseOutput } from './ActorRuleParse';

/**
 * A base actor for listening to Rule parse events that has fixed media types.
 *
 * Actor types:
 * * Input:  IActionRuleParseOrMediaType:      A parse input or a media type input.
 * * Test:   <none>
 * * Output: IActorOutputRuleParseOrMediaType: The parsed quads.
 *
 * @see IActionInit
 */
export abstract class ActorRuleParseFixedMediaTypes extends ActorAbstractMediaTypedFixed<
IActionRuleParse, IActorTest, IActorRuleParseOutput> implements IActorRuleParseFixedMediaTypesArgs {
  // TODO: See if we need the JSDoc from
  // https://github.com/comunica/comunica/blob/master/packages/bus-rdf-parse/lib/ActorRdfParseFixedMediaTypes.ts
  
  /**
   * TODO: rm this (and eslint-disable) once we remove the abstract media typed actor
   * @param args - @defaultNested {<cbrp:components/ActorRuleParse.jsonld#ActorRuleParse_default_bus> a <cc:components/Bus.jsonld#Bus>} bus
   */
  public constructor(args: IActorRuleParseFixedMediaTypesArgs) {
    super(args);
  }

  public async testHandleChecked(action: IActionRuleParse): Promise<boolean> {
    return true;
  }
}

export interface IActorRuleParseFixedMediaTypesArgs
  extends IActorArgsMediaTypedFixed<IActionRuleParse, IActorTest, IActorRuleParseOutput> {}
