import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput, IActorRdfReasonArgs, ActorRdfReasonMediated, IActorRdfReasonMediatedArgs, IActionRdfReasonExecute } from '@comunica/bus-rdf-reason';
import { IActorArgs, IActorTest } from '@comunica/core';
import { MediatorRuleEvaluate } from '@comunica/bus-rule-evaluate'
import { union, AsyncIterator } from 'asynciterator';
import { Quad } from '@rdfjs/types';
import { IActionContext } from '@comunica/types';
import { Rule } from '@comunica/reasoning-types';

/**
 * A comunica Forward Chaining RDF Reason Actor.
 */
export class ActorRdfReasonForwardChaining extends ActorRdfReasonMediated {
  mediatorRuleEvaluate: MediatorRuleEvaluate;

  public constructor(args: IActorRdfReasonForwardChainingArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  private evaluateRules(rules: Rule[], context: IActionContext, quadStream?: AsyncIterator<Quad>): AsyncIterator<Quad> {
    return union(rules.map(
      rule => this.mediatorRuleEvaluate.mediate(({ rule, context, quadStream })).then(res => res.results)
    ));
  }

  public async execute({ rules, context }: IActionRdfReasonExecute): Promise<void> {
    // Get the initial stream of reasoning results
    const quadStream = this.evaluateRules(rules, context);
    // Continue to apply reasoning using only the new results
    quadStream.filter()
  }
}

export interface IActorRdfReasonForwardChainingArgs extends IActorRdfReasonMediatedArgs {
  mediatorRuleEvaluate: MediatorRuleEvaluate;
}
