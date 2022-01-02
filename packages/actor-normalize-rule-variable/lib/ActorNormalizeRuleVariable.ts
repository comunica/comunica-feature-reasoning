import { ActorNormalizeRule, IActionNormalizeRule, IActorNormalizeRuleOutput } from '@comunica/bus-normalize-rule';
import { Rule } from '@comunica/bus-rule-parse';
import { IActorArgs, IActorTest } from '@comunica/core';
import { variable, quad } from '@rdfjs/data-model';
import * as RDF from '@rdfjs/types';

/**
 * A comunica actor that normalizes variables in rules
 */
export class ActorNormalizeRuleVariable extends ActorNormalizeRule {
  public constructor(args: IActorArgs<IActionNormalizeRule, IActorTest, IActorNormalizeRuleOutput>) {
    super(args);
  }

  public async test(action: IActionNormalizeRule): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionNormalizeRule): Promise<IActorNormalizeRuleOutput> {
    
    const rules = action.rules.map(({ premise, conclusion }) => {
      let mapping: { [key: string]: RDF.Variable } = {};
      let count = 0;

      function normalize<T extends RDF.Term>(term: T): T | RDF.Variable {
        return term.termType === 'Variable' ? mapping[term.value] ??= variable(`?v${count++}`) : term;
      }

      function normalizeQuads(quads: RDF.Quad[]) {
        return quads.map(q => quad(
          normalize(q.subject),
          normalize(q.predicate),
          normalize(q.object),
          normalize(q.graph),
        ))
      }

      return {
        premise: normalizeQuads(premise),
        conclusion: conclusion && normalizeQuads(conclusion)
      }
    })

    return { ...action, rules }; // TODO implement
  }
}
