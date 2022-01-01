import { ActorOptimizeRule, IActionOptimizeRule, IActorOptimizeRuleOutput } from '@comunica/bus-optimize-rule';
import { Rule } from '@comunica/bus-rule-parse';
import { IActorArgs, IActorTest } from '@comunica/core';
import * as RDF from '@rdfjs/types';
import { RestrictableRule } from '../../actor-rdf-reason-rule-restriction/lib/reasoner';

/**
 * A comunica actor that restricts rules to only those needed to produce data matching a particular pattern
 */
export class ActorOptimizeRulePatternRestriction extends ActorOptimizeRule {
  public constructor(args: IActorArgs<IActionOptimizeRule, IActorTest, IActorOptimizeRuleOutput>) {
    super(args);
  }

  public async test(action: IActionOptimizeRule): Promise<IActorTest> {
    const { pattern } = action;
    
    if (!pattern) {
      throw new Error('A Pattern is required for ActorOptimizeRulePatternRestriction')
    }
    
    // This actor is not useful on the pattern ?s ?p ?o ?g
    const hash: { [key: string]: boolean } = {}
    
    function uniqueVariable(term: RDF.Term) {
      if (term.termType === 'Variable') {
        if (hash[term.value]) {
          return false;
        }
        hash[term.value] = true;
        return true;
      }
      return false;
    }
    
    if (uniqueVariable(pattern.subject) && uniqueVariable(pattern.predicate) && uniqueVariable(pattern.object) && uniqueVariable(pattern.graph)) {
      throw new Error('Cannot optimise a pattern with all distinct variables');
    }

    return true;
  }

  public async run(action: IActionOptimizeRule): Promise<IActorOptimizeRuleOutput> {
    return action;
    // return true; // TODO implement
  }
}

// TODO: Improve this
function termMatches(value: RDF.Term, pattern: RDF.Term) {
  return pattern.termType === 'Variable'
    || value.termType === 'Variable'
    || value.equals(pattern)
}

// This can be improved by ensuring that variable occurences
// match each other similar to in in the HyLAR reasoner
function matches(value: RDF.Quad, pattern: RDF.Quad) {
  return termMatches(value.subject, pattern.subject)
    && termMatches(value.predicate, pattern.predicate)
    && termMatches(value.object, pattern.object)
    && termMatches(value.graph, pattern.graph)
}

/**
 * @param rules The full rule set to be reasoned over
 * @param patterns The patterns that we are to match against in the rule set
 */
function restrictNaive(rules: RestrictableRule[], patterns: RDF.Quad[]): RestrictableRule[] {
  let allPatterns = [...patterns];
  let unusedRules = [...rules];
  let unusedRulesNew: RestrictableRule[] = [];
  let allRules: RestrictableRule[] = [];
  let size = -1;
  while (unusedRules.length > 0 && size < allRules.length) {
    size = allRules.length;
    for (const rule of unusedRules) {
      // Test to see if there is any match
      if (rule.conclusion.some(quad => patterns.some(pattern => matches(quad, pattern)))) {
        allRules.push(rule)
        allPatterns = allPatterns.concat(rule.premise)
      } else {
        unusedRulesNew.push(rule)
      }
    }
    unusedRules = unusedRulesNew
    unusedRulesNew = []
  }
  return allRules
}

// Considering
// (?uuu ?aaa ?yyy) -> (?aaa rdf:type rdf:Property)
// (?aaa rdfs:domain ?xxx) ^ (?uuu ?aaa ?yyy) -> (?uuu rdf:type ?xxx)
// (?aaa rdfs:range ?xxx) ^ (?uuu ?aaa ?vvv) -> (?vvv rdf:type ?xxx)
// (?uuu ?aaa ?xxx) -> (?uuu rdf:type rdfs:Resource)
// (?uuu ?aaa ?vvv) -> (?vvv rdf:type rdfs:Resource)
// (?uuu rdfs:subPropertyOf ?vvv) ^ (?vvv rdfs:subPropertyOf ?xxx) -> (?uuu rdfs:subPropertyOf ?xxx)
// (?uuu rdf:type rdf:Property) -> (?uuu rdfs:subPropertyOf ?uuu)
// (?aaa rdfs:subPropertyOf ?bbb) ^ (?uuu ?aaa ?yyy) -> (?uuu ?bbb ?yyy)
// (?uuu rdf:type rdfs:Class) -> (?uuu rdfs:subClassOf rdfs:Resource)
// (?uuu rdfs:subClassOf ?xxx) ^ (?vvv rdf:type ?uuu) -> (?vvv rdf:type ?xxx)
// (?uuu rdf:type rdfs:Class) -> (?uuu rdfs:subClassOf ?uuu)
// (?uuu rdfs:subClassOf ?vvv) ^ (?vvv rdfs:subClassOf ?xxx) -> (?uuu rdfs:subClassOf ?xxx)
// (?uuu rdf:type rdfs:ContainerMembershipProperty) -> (?uuu rdfs:subPropertyOf rdfs:member)
// (?uuu rdf:type rdfs:Datatype) -> (?uuu rdfs:subClassOf rdfs:Literal)

// One path - simplify rules using sparql
// (?uuu ?aaa ?yyy) -> (?aaa rdf:type rdf:Property)
// (?aaa rdfs:domain ?xxx) ^ (?uuu ?aaa ?yyy) -> (?uuu rdf:type ?xxx)
// (?aaa rdfs:range ?xxx) ^ (?uuu ?aaa ?vvv) -> (?vvv rdf:type ?xxx)
// (?uuu ?aaa ?xxx) -> (?uuu rdf:type rdfs:Resource)
// (?uuu ?aaa ?vvv) -> (?vvv rdf:type rdfs:Resource)
// (?uuu rdfs:subPropertyOf ?vvv) ^ (?vvv rdfs:subPropertyOf ?xxx) -> (?uuu rdfs:subPropertyOf ?xxx)
// (?uuu rdf:type rdf:Property) -> (?uuu rdfs:subPropertyOf ?uuu)
// (?aaa rdfs:subPropertyOf ?bbb) ^ (?uuu ?aaa ?yyy) -> (?uuu ?bbb ?yyy)
// (?uuu rdf:type rdfs:Class) -> (?uuu rdfs:subClassOf rdfs:Resource)
// (?uuu rdfs:subClassOf ?xxx) ^ (?vvv rdf:type ?uuu) -> (?vvv rdf:type ?xxx)
// (?uuu rdf:type rdfs:Class) -> (?uuu rdfs:subClassOf ?uuu)
// (?uuu rdfs:subClassOf ?vvv) ^ (?vvv rdfs:subClassOf ?xxx) -> (?uuu rdfs:subClassOf ?xxx)
// (?uuu rdf:type rdfs:ContainerMembershipProperty) -> (?uuu rdfs:subPropertyOf rdfs:member)
// (?uuu rdf:type rdfs:Datatype) -> (?uuu rdfs:subClassOf rdfs:Literal)




// Ok this is bad - finish later, however, lets now just consider 'abox' rdfs
// (?aaa rdfs:domain ?xxx) ^ (?uuu ?aaa ?yyy) -> (?uuu rdf:type ?xxx)
// (?aaa rdfs:range ?xxx) ^ (?uuu ?aaa ?vvv) -> (?vvv rdf:type ?xxx)
// (?aaa rdfs:subPropertyOf ?bbb) ^ (?uuu ?aaa ?yyy) -> (?uuu ?bbb ?yyy)
// (?uuu rdfs:subClassOf ?xxx) ^ (?vvv rdf:type ?uuu) -> (?vvv rdf:type ?xxx)


// Round 1
// (?aaa rdfs:domain ?xxx) ^ (t ?aaa ?yyy) -> (t rdf:type ?xxx)
// (?aaa rdfs:range ?xxx) ^ (?uuu ?aaa t) -> (t rdf:type ?xxx)
// (?aaa rdfs:subPropertyOf rdf:type) ^ (t ?aaa ?yyy) -> (t rdf:type ?yyy)
// (?uuu rdfs:subClassOf ?xxx) ^ (t rdf:type ?uuu) -> (t rdf:type ?xxx)



// (?aaa rdfs:domain ?xxx) ^ (t ?aaa ?yyy) = ( (?aaa rdfs:domain ?xxx) || ((?xxx rdfs:subPropertyOf rdfs:domain) ^ (?aaa ?xxx ?yyy)) )




// Round 2 [?aaa rdfs:domain ?xxx], [?aaa rdfs:range ?xxx], [t ?aaa ?yyy], [?uuu rdfs:subClassOf ?xxx]
// (?aaa rdfs:domain ?xxx) ^ (t ?aaa ?yyy) -> (t rdf:type ?xxx)
// (?aaa rdfs:range ?xxx) ^ (?uuu ?aaa t) -> (t rdf:type ?xxx)
// (?aaa rdfs:subPropertyOf rdf:type) ^ (t ?aaa ?yyy) -> (t rdf:type ?yyy)
// (?uuu rdfs:subClassOf ?xxx) ^ (t rdf:type ?uuu) -> (t rdf:type ?xxx)





// (?uuu ?aaa ?xxx) -> (?uuu rdf:type rdfs:Resource)
// (?uuu ?aaa ?vvv) -> (?vvv rdf:type rdfs:Resource)




// Round 1 [timbl a ?o]
// (?uuu rdfs:subClassOf ?xxx) ^ (timbl rdf:type ?uuu) -> (timbl rdf:type ?xxx)
// (?aaa rdfs:subPropertyOf rdf:type) ^ (timbl ?aaa ?yyy) -> (timbl rdf:type ?yyy)
// (timbl ?aaa ?xxx) -> (timbl rdf:type rdfs:Resource)
// (?uuu ?aaa timbl) -> (timbl rdf:type rdfs:Resource)
// (?aaa rdfs:domain ?xxx) ^ (timbl ?aaa ?yyy) -> (timbl rdf:type ?xxx)
// (?aaa rdfs:range ?xxx) ^ (?uuu ?aaa timbl) -> (timbl rdf:type ?xxx)

// Throw out all patterns that are 'subsets' of others
// Round 2 [timbl ?aaa ?yyy], [?uuu rdfs:subClassOf ?xxx], [?aaa rdfs:subPropertyOf rdf:type], [?uuu ?aaa timbl], [?aaa rdfs:domain ?xxx], [?aaa rdfs:range ?xxx]

// [?uuu rdfs:subClassOf ?xxx]
// (?uuu rdf:type rdfs:Class) -> (?uuu rdfs:subClassOf rdfs:Resource)
// (?uuu rdf:type rdfs:Class) -> (?uuu rdfs:subClassOf ?uuu)
// (?uuu rdfs:subClassOf ?vvv) ^ (?vvv rdfs:subClassOf ?xxx) -> (?uuu rdfs:subClassOf ?xxx)
// (?uuu rdf:type rdfs:Datatype) -> (?uuu rdfs:subClassOf rdfs:Literal)
