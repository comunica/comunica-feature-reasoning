import type { IActionOptimizeRule, IActorOptimizeRuleOutput } from '@comunica/bus-optimize-rule';
import { ActorOptimizeRule } from '@comunica/bus-optimize-rule';
import { Rule } from '@comunica/bus-rule-parse';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { quad, variable } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import type { RestrictableRule } from '../../actor-rdf-reason-rule-restriction/lib/reasoner';
import { mapTerms } from 'rdf-terms';
import { termToString } from 'rdf-string'

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

// Can use https://github.com/ucbl/HyLAR-Reasoner/blob/428892046d265be081195e2ca7f154e6bf1d68bd/hylar/core/Logics/Rule.js#L105
// https://github.com/ucbl/HyLAR-Reasoner/blob/428892046d265be081195e2ca7f154e6bf1d68bd/hylar/core/Logics/Logics.js#L146
function createDepsTree(rules: Rule[]) {
  // This doesn't work because of submatching
  const premiseDeps: { [key: string]: Rule[] } = {};
  for (const rule of rules) {
    for (const premise of rule.premise) {
      (premiseDeps[normalizedString(premise)] ??= []).push(rule);
    }
  }

  const ruleDeps: { [key: string]: Rule[] } = {};
}

// In order for a Rule to be applied *all* of its premises must be matched by at least 1 term *and*
// at least one premise must have a new match from the last iteration. 

function normalizedString(term: RDF.Quad): string {
  let count = 0;
  let map: {[key: string]: RDF.Variable} = {};

  const quad = mapTerms(term, term => {
    if (term.termType === 'Variable') {
      if (term.value in map) {
        return map[term.value]
      }
      return map[term.value] = variable(`?v${count++}`);
    }
    return term;
  });

  return termToString(quad);
}


// function depsTreeStore() {
//   const store = new Store();
// }





// Possible proposal for rule syntax is one that uses sparql paths; i.e.
// ?s a/subClassOf* ?o -> ?s a ?o
// ?s subClassOf+ ?o -> ?s subClassOf ?o

// Further exploration - look at when there are multiple routes to the same result, (for instance subclass of vs. a) and remove redundant rules
// ?s a ?o & ?o subClass ?o2 -> ?s a ?o2
// ?o subClass ?o2 & ?o2 subClass ?o3 -> ?o subClass ?o3

// Want to get tim a ?o, and we want to prove that any data of this form which is produced using data from the 2nd rule can in fact be produced using data only from the first rule

// Now, the second rule, is only useful if it is 'substituted' into the first rule to produce the fact that
// ?s a ?o & ?o subClass ?o2 & ?o2 subClass ?o3  -> ?s a ?o3
// However, the same expanded rule can be produced by applying the first rule twice
// A *naive* approach to test if a dependent rule is *actually* necessary would be to follow this substitution style approach


// More generally, we need to test if our *existing* set of rules entails the proposed new rule


// Starting with jesse a ?o & ?o subClass ?o2 -> jesse a ?o2

// Considering stage of whether to add rule ... ?o1 subClass ?o2 & ?o2 subClass ?o2 -> ?o1 subClass ?o3
// First update the variables to match the dep
// ?o subClass ?o1 & ?o1 subClass ?o2 -> ?o subClass ?o2


function ruleIsImplicit(additionCause: Rule[]) {

  // return additionCause.length === 1 && additionCause[0].conclusion.length === 1 && additionCause[0].conclusion[0].predicate.termType === 'Variable';
}

type Normalize = (rules: Rule) => Rule;
type Match = (quad: RDF.Quad, pattern: RDF.Quad) => boolean;

interface DeducibilityMatch {
  premise: RDF.Quad;
  conclusion: RDF.Quad;
  premiseIndex: number;
  conclusionIndex: number;
  rule: Rule;
}

function isNecessaryAddition(addition: Rule, causedBy: Rule, causeQuad: RDF.Quad) {
  // TODO: Follow the naive substitution pattern


}


/**
 * Tests to see if a {@param rule} is deducible from other {@param rules}
 * @param {Normalize} normalize A function which converts rules to a normal form - this should include standardise methods for ordering premises and conclusions, and normalized use of variables.
 * @param {Match} match A function which tests if a {RDF.Quad} matches an {RDF.Quad}
 */
function ruleIsDeducible(rule: Rule, rules: Rule[], normalize: Normalize, match: Match) {
  if (rule.conclusion === false) {
    throw new Error('ruleIsDeducible cannot handle rules with a false conclusion')
  }

  const matches: DeducibilityMatch[] = [];
  
  for (const conclusion of rule.conclusion) {
    for (const r of rules) {
      for (const premise of r.premise) {
        if (match(premise, conclusion)) {
          return true;
        }
      }
    }
  }
  
  
  
  // Find a(ll) (combinations of?) rule(s) which satisfies the premise(s)
  // const relevantRules = rules.flatMap((rule) => {
  //   rule.premise.filter(premise => matches())
  // })
  // 

  rules.map(({}) => {

  })
}

// Test cases ?s a ?o & ?o subClass ?o2 & ?o2 subClass ?o3  -> ?s a ?o3 should be deducible from [?s a ?o & ?o subClass ?o2  -> ?s a ?o2]


// Starting with (?aaa rdfs:subPropertyOf ?bbb) ^ (?uuu ?aaa ?yyy) -> (?uuu ?bbb ?yyy)
// Starting with (?uuu rdfs:subPropertyOf ?vvv) ^ (?vvv rdfs:subPropertyOf ?xxx) -> (?uuu rdfs:subPropertyOf ?xxx)
// ()

// Using jesse knows ?o

// Starting with (?aaa rdfs:subPropertyOf knows) ^ (jesse ?aaa ?yyy) -> (jesse knows ?yyy)
// Dont need to add
// Starting with (?uuu rdfs:subPropertyOf ?vvv) ^ (?vvv rdfs:subPropertyOf knows) -> (?uuu rdfs:subPropertyOf knows)
// - \\// - \\// - \\// - \\// - \\//

// function isRuleRequired(premises: RDF.Quad[], conclusion: RDF.Quad, ) {
// }




