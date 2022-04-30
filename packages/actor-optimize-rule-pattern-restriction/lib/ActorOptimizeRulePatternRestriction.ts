import type {
  IActionOptimizeRule, IActorOptimizeRuleArgs, IActorOptimizeRuleOutput,
} from '@comunica/bus-optimize-rule';
import { ActorOptimizeRule } from '@comunica/bus-optimize-rule';
import type { IActorTest } from '@comunica/core';
import type { IPremiseConclusionRule } from '@comunica/reasoning-types';
import type * as RDF from '@rdfjs/types';
import { fromArray } from 'asynciterator';
import { everyTerms } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';

/**
 * A comunica actor that restricts rules to only those needed to produce data matching a particular pattern
 */
export class ActorOptimizeRulePatternRestriction extends ActorOptimizeRule {
  public constructor(args: IActorOptimizeRuleArgs) {
    super(args);
  }

  public async test(action: IActionOptimizeRule): Promise<IActorTest> {
    const { pattern } = action;

    if (!pattern) {
      throw new Error('A Pattern is required for ActorOptimizeRulePatternRestriction');
    }

    // This actor is not useful on the pattern ?s ?p ?o ?g
    const hash: Record<string, boolean> = {};

    function uniqueVariable(term: RDF.Term): boolean {
      if (term.termType === 'Variable') {
        if (hash[term.value]) {
          return false;
        }
        hash[term.value] = true;
        return true;
      }
      return false;
    }

    if (everyTerms(pattern, uniqueVariable)) {
      throw new Error('Cannot optimise a pattern with all distinct variables');
    }

    // TODO: ADD THIS BACK IN
    // if (action.rules.some(rule => rule.conclusion === false)) {
    //   throw new Error('Cannot restrict rules with a false conclusion');
    // }

    return true;
  }

  public async run(action: IActionOptimizeRule): Promise<IActorOptimizeRuleOutput> {
    // TODO: REMOVE THIS IN FUTURE
    const rules = action.rules.filter<IPremiseConclusionRule>(
      (rule): rule is IPremiseConclusionRule => rule.conclusion !== false,
    );
    return { ...action, rules: fromArray(restrictNaive(await rules.toArray(), [ action.pattern! ])) };
  }
}

/**
 * @param rules The full rule set to be reasoned over
 * @param patterns The patterns that we are to match against in the rule set
 */
function restrictNaive(rules: IPremiseConclusionRule[], patterns: (Algebra.Pattern | RDF.Quad)[]):
IPremiseConclusionRule[] {
  let allPatterns = [ ...patterns ];
  let unusedRules = [ ...rules ];
  let unusedRulesNew: IPremiseConclusionRule[] = [];
  const allRules: IPremiseConclusionRule[] = [];
  let size = -1;
  while (unusedRules.length > 0 && size < allRules.length) {
    size = allRules.length;
    for (const rule of unusedRules) {
      // Test to see if there is any match
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      if (rule.conclusion.some(quad => allPatterns.some(pattern => matchPatternMappings(pattern, quad)))) {
        allRules.push(rule);
        allPatterns = allPatterns.concat(rule.premise);
      } else {
        unusedRulesNew.push(rule);
      }
    }
    unusedRules = unusedRulesNew;
    unusedRulesNew = [];
  }
  return allRules;
}

// TODO: Use an existing function from rdf-terms or move this logic into that package
/**
 * Check if the base quad matches against all terms in the pattern.
 *
 * Each term in the quad must satisfy the following:
 * * The pattern term is a variable, and all other variables with the same value - map to the same terms in the quad
 * * Both the quad term and pattern term are quads - and they satisfy the same conditions
 * * The pattern and quad terms are equal and not variables or quads
 *
 * @param pattern A pattern - possibly containing variables
 * @param quad A quad - possibly containing variables
 */
export function matchPatternMappings(pattern: RDF.Quad | Algebra.Pattern, quad: Algebra.Pattern | RDF.Quad): boolean {
  const mapping: Record<string, RDF.Term> = {};
  return everyTerms(pattern, (term, key) => {
    if (quad[key].termType === 'Variable') {
      return true;
    }
    if (term.termType !== 'Variable') {
      return term.equals(quad[key]);
    }
    // eslint-disable-next-line no-return-assign
    return term.value in mapping ? mapping[term.value].equals(quad[key]) : (mapping[term.value] = quad[key]) && true;
  });
}
