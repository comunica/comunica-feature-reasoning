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

interface IActionRuleParseMetadata {
  /**
   * The base IRI for parsed rules.
   */
  baseIRI: string;
}

export type IActionRuleParse = IActionParse<IActionRuleParseMetadata>;

export type IActorRuleParseOutput = IActorParseOutput<RDF.Re<Rule>, undefined>;

function rule(...args: ConstructorParameters<typeof Rule>) {
  return new Rule(...args);
}

export class Rule {
  public constructor(
    premise: RDF.Quad[],
    conclusion: RDF.Quad[] | false,
    // Conclusion: RDF.Quad[]
  ) {
    this.premise = premise;
    this.conclusion = conclusion;
  }

  /**
   * Antecedents for the rule
   */
  premise: RDF.Quad[];
  /**
   * Consequent(s) for the rule
   */
  // conclusion: RDF.Quad[] | false;
  conclusion: RDF.Quad[] | false;

  // Public equals(other: Rule): boolean {
  //   if (this.conclusion === false) {
  //     return other.conclusion === false && quadEq(this.premise, other.premise)
  //   } else {
  //     return other.conclusion !== false && quadEq(this.premise, other.premise) && quadEq(this.conclusion, other.conclusion)
  //   }
  // }
}

function quadEq(a: RDF.Quad[], b: RDF.Quad[]): boolean {
  return a.length === b.length && a.every((quad, index) => quad.equals(b[index]));
}
