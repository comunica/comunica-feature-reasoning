import { Rule } from '@comunica/bus-rule-parse';
import type { IActorTest } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import type { AsyncIterator } from 'asynciterator';
import type { Algebra } from 'sparqlalgebrajs';
import { ActorRuleResolve, IActorRuleResolveArgs, IActionRuleResolve, IActorRuleResolveOutput } from './ActorRuleResolve';
// import { ActorRdfResolveQuadPattern } from './ActorRdfResolveQuadPattern';

/**
 * A base implementation for rdf-resolve-quad-pattern events
 * that wraps around an {@link IRuleSource}.
 *
 * @see IRuleSource
 */
export abstract class ActorRuleResolveSource extends ActorRuleResolve {
  public constructor(args: IActorRuleResolveArgs) {
    super(args);
  }

  public async test(action: IActionRuleResolve): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionRuleResolve): Promise<IActorRuleResolveOutput> {
    return { data: (await this.getSource(action.context)).get() };
  }

  /**
   * Get a source instance for the given context.
   */
  protected abstract getSource(context: IActionContext): Promise<IRuleSource>;
}

/**
 * A lazy rule source.
 */
export interface IRuleSource {
  /**
   * Returns a (possibly lazy) stream that processes all quads matching the pattern.
   * @return {AsyncIterator<Rule>} The resulting rule stream.
   */
  get: () => AsyncIterator<Rule>;
}
