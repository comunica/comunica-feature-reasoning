import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput, IActorRdfReasonArgs, ActorRdfReasonMediated, IActorRdfReasonMediatedArgs, IActionRdfReasonExecute } from '@comunica/bus-rdf-reason';
import { IActorArgs, IActorTest } from '@comunica/core';
import { MediatorRuleEvaluate } from '@comunica/bus-rule-evaluate'
import { union, AsyncIterator, single, empty, fromArray, EmptyIterator, ArrayIterator, UnionIterator } from 'asynciterator';
import { Quad } from '@rdfjs/types';
import { IActionContext } from '@comunica/types';
import { INestedPremiseConclusionRule, IPremiseConclusionRule, Rule } from '@comunica/reasoning-types';
import { maybeIterator, WrappingIterator } from './util'
import { MediatorRdfUpdateQuadsInfo } from '@comunica/bus-rdf-update-quads-info';
import { MediatorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads';
import * as RDF from '@rdfjs/types';
import { forEachTerms, mapTerms } from 'rdf-terms';

interface IRuleNode {
  rule: Rule;
  next: { rule: IRuleNode, index: number }[];
}

interface IConsequenceData {
  quads: AsyncIterator<Quad>;
  rule: IRuleNode;
}

// TODO: Use similar functions already developed
function substitute(quad: RDF.Quad, map:  Record<string, RDF.Term>): RDF.Quad {
  return mapTerms(quad, (term) => {
    if (term.termType === 'Variable' && term.value in map) {
      return map[term.value];
    }
    return term;
  });
}

function maybeSubstitute({ rule: { rule, next }, index }: { rule: IRuleNode, index: number }, quad: Quad): IRuleNode | null {
  let mapping: Record<string, RDF.Term> | null = {};
  const pattern = rule.premise[index];

  forEachTerms(pattern, (term, name) => {
    if (term.termType === 'Variable' && mapping) {
      if (term.value in mapping) {
        if (!quad[name].equals(mapping[term.value])) {
          mapping = null;
        }
      } else {
        mapping[term.value] = quad[name];
      }
    }
  });

  if (mapping === null) {
    return null;
  }

  const premise: RDF.Quad[] = [];

  for (let i = 0; i < rule.premise.length; i++) {
    if (i !== index) {
      premise.push(substitute(rule.premise[i], mapping));
    }
  }

  const conclusion = rule.conclusion && rule.conclusion.map(conclusion => substitute(conclusion, mapping!));

  return {
    rule: {
      // TODO: See if we can just use the existing rule type
      ruleType: 'rdfs',
      premise,
      conclusion
    },
    next
  }
}

/**
 * A comunica Forward Chaining RDF Reason Actor.
 */
export class ActorRdfReasonForwardChaining extends ActorRdfReasonMediated {
  mediatorRuleEvaluate: MediatorRuleEvaluate;
  mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;

  public constructor(args: IActorRdfReasonForwardChainingArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  // This should probably be a mediator of its own
  private async evaluateInsert(rule: IRuleNode, context: IActionContext): Promise<AsyncIterator<RDF.Quad>> {
    const { results } = await this.mediatorRuleEvaluate.mediate({ rule: rule.rule, context });
    const { execute } = await this.mediatorRdfUpdateQuadsInfo.mediate({
      context, quadStreamInsert: results, filterSource: true
    });
    const { quadStreamInsert } = await execute();
    return quadStreamInsert ?? new ArrayIterator([], { autoStart: false });
  }

  private evaluteInsertRule(rule: IRuleNode, context: IActionContext): IConsequenceData {
    const quads: AsyncIterator<RDF.Quad> = new WrappingIterator(this.evaluateInsert(rule, context));
    return { quads, rule };
  }

  private async fullyEvaluateRules(_rule: IRuleNode[], context: IActionContext): Promise<void> {
    let results: AsyncIterator<IConsequenceData> | null = fromArray(_rule).map(rule => this.evaluteInsertRule(rule, context));

    while ((results = await maybeIterator(results)) !== null) {
      results = new UnionIterator(results.map(({ quads, rule }) => {
        let newRules = new UnionIterator(quads.map(quad => fromArray(rule.next).map(rule => maybeSubstitute(rule, quad))), { autoStart: false })
        // TODO: Remove this line once https://github.com/RubenVerborgh/AsyncIterator/pull/59 is merged  
        .filter((rule): rule is IRuleNode => rule !== null)
        
        return newRules.map(rule => this.evaluteInsertRule(rule, context));
      }), { autoStart: false });
    }
  }

  public async execute({ rules, context }: IActionRdfReasonExecute): Promise<void> {
    
  }
}

export interface IActorRdfReasonForwardChainingArgs extends IActorRdfReasonMediatedArgs {
  mediatorRuleEvaluate: MediatorRuleEvaluate;
  mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;
}
