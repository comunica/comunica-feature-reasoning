import { Actor, IAction, IActorArgs, IActorOutput, IActorTest } from '@comunica/core';
import type { ActionContext } from '@comunica/types'
import * as RDF from '@rdfjs/types'
import {} from '@comunica/bus-rdf-resolve-quad-pattern'
/**
 * A comunica actor for rule-resolve-rule events.
 *
 * Actor types:
 * * Input:  IActionRuleResolveRule:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorRuleResolveRuleOutput: TODO: fill in.
 *
 * @see IActionRuleResolveRule
 * @see IActorRuleResolveRuleOutput
 */
export abstract class ActorRuleResolveRule extends Actor<IActionRuleResolveRule, IActorTest, IActorRuleResolveRuleOutput> {
  public constructor(args: IActorArgs<IActionRuleResolveRule, IActorTest, IActorRuleResolveRuleOutput>) {
    super(args);
  }
}

export interface IActionRuleResolveRule extends IAction {

}

export interface IActorRuleResolveRuleOutput extends IActorOutput {
  /**
   * The resulting rule stream.
   */
  rules: AsyncIterator<Rule>;
}


export type IRuleSource = string | RDF.Source | {
  type?: string;
  value: string | RDF.Source;
  context?: ActionContext;
};

export type DataSources = IRuleSource[];
interface Rule {
  premise: RDF.Quad[];
  conclusion: RDF.Quad[] | false;
}

enum KeysRuleResolveRule {
  // TODO: SORT PROPER KEY
  sources = "sources",
  source = "source"
}

// THIS IS DESIGNED TO BE EQUIVALENT TO https://github.com/comunica/comunica/blob/master/packages/bus-rdf-resolve-quad-pattern/lib/ActorRdfResolveQuadPattern.ts