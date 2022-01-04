import type { IActionOptimizeRule, IActorOptimizeRuleOutput } from '@comunica/bus-optimize-rule';
import { ActorOptimizeRule } from '@comunica/bus-optimize-rule';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { quad, variable } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import type { RestrictableRule } from '../../actor-rdf-reason-rule-restriction/lib/reasoner';

/**
 * A rule optimizer that updates rules so that they restrict the results they produce to be relevant to a particular pattern
 */
export class ActorOptimizeRulePatternSubstitution extends ActorOptimizeRule {
  public constructor(args: IActorArgs<IActionOptimizeRule, IActorTest, IActorOptimizeRuleOutput>) {
    super(args);
  }

  public async test(action: IActionOptimizeRule): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionOptimizeRule): Promise<IActorOptimizeRuleOutput> {
    return action; // TODO implement
  }
}

// TODO: Improve this
function termMatches(value: RDF.Term, pattern: RDF.Term) {
  return pattern.termType === 'Variable' ||
    value.termType === 'Variable' ||
    value.equals(pattern);
}

// This can be improved by ensuring that variable occurences
// match each other similar to in in the HyLAR reasoner
function matches(value: RDF.Quad, pattern: RDF.Quad) {
  return termMatches(value.subject, pattern.subject) &&
    termMatches(value.predicate, pattern.predicate) &&
    termMatches(value.object, pattern.object) &&
    termMatches(value.graph, pattern.graph);
}

// TODO: FINISH

function restrictSubstitution(rules: RestrictableRule[], patterns: RDF.Quad[]) {
  // Probably better as a store
  let allPatterns = [ ...patterns ];
  const substitutedRules: RestrictableRule[] = [];
  const size = -1;
  // For each rule, filter to only care about the *consequents* in allPatterns
  while (size < substitutedRules.length) {
    for (const rule of rules) {
      for (const conclusion of rule.conclusion) {
        for (const pattern of allPatterns) {
          if (matches(conclusion, pattern)) {
            const substituted = substitute(rule.premise, conclusion, pattern);
            substitutedRules.push(substituted);
            allPatterns = allPatterns.concat(substituted.premise);
          }
        }
      }
    }
  }
  return substitutedRules;
}

type Mapping = Record<string, RDF.Term>;

// TODO See if there is bug similar to that resolved by the advanced matcher in the pattern-restriction actor
function substitute(premises: RDF.Quad[], consequent: RDF.Quad, pattern: RDF.Quad): RestrictableRule {
  const localMapping: Mapping = {};
  const takenVars: Record<string, boolean> = {};
  const newPremises: RDF.Quad[] = [];
  let varCount = 0;

  function factElemMatches(factElem: RDF.Term, causeElem: RDF.Term) {
    if (causeElem.termType === 'Variable') {
      localMapping[causeElem.value] = factElem;
      if (factElem.termType === 'Variable') {
        takenVars[factElem.value] = true;
      }
    }
  }

  factElemMatches(pattern.predicate, consequent.predicate);
  factElemMatches(pattern.object, consequent.object);
  factElemMatches(pattern.subject, consequent.subject);
  factElemMatches(pattern.graph, consequent.graph);

  function matcher(term: RDF.Term) {
    if (term.termType !== 'Variable') {
      return term;
    }

    if (term.value in localMapping) {
      return localMapping[term.value];
    }

    if (term.value in takenVars) {
      let name: string;
      while ((name = `?v${varCount}`) in takenVars) {
        varCount += 1;
      }
      takenVars[name] = true;
      localMapping[term.value] = variable(name);
      return localMapping[term.value];
    }

    return term;
  }

  // Function matcher(term: RDF.Term) {
  //   if (term.termType !== 'Variable') {
  //     return term;
  //   }

  //   if (term.value in localMapping) {
  //     return localMapping[term.value]
  //   }

  //   if (term.value in takenVars) {
  //     while(`?v${varCount}` in takenVars) {
  //       varCount += 1;
  //     }
  //     takenVars[`?v${varCount}`] = true;
  //     localMapping[term.value] = variable(`?v${varCount}`);
  //     return localMapping[term.value];
  //   }

  //   return term;
  // }
  // rule.conclusion
  // TODO Double check
  // const mapping = getLocalMapping(pattern, consequent);
  // We need to make sure that we don't map *to* any existing variables
  // let varCount = 0
  for (const premise of premises) {
    const q = quad<RDF.BaseQuad>(
      matcher(premise.subject),
      matcher(premise.predicate),
      matcher(premise.object),
      matcher(premise.graph),
    );
    // @ts-expect-error: TODO: Apply is-quad check
    newPremises.push(q);
  }

  return {
    premise: premises,
    conclusion: [ pattern ],
  };

  // Mapping[]
}
