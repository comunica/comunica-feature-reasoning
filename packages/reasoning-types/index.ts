export interface BaseRule {
  /**
   * This should be the equivalent to termType in RDF Terms
   */
  ruleType: string;
}

export interface RDFSRule extends BaseRule {
  /**
   * 
   */
  ruleType: 'rdfs';
}

export interface OWL2RLRule extends BaseRule {

}



export type Rule = RDFSRule | OWL2RLRule;
