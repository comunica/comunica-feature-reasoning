import type { Quad } from '@rdfjs/types';

export interface IBaseRule {
  /**
   * This should be the equivalent to termType in RDF Terms
   */
  ruleType: string;
}

export interface IRDFSRule extends IBaseRule {
  /**
   *
   */
  ruleType: 'rdfs';
  premise: Quad[];
  conclusion: Quad[] | false;
}

export interface IOWL2RLRule extends IBaseRule {
  ruleType: 'owl2rl';
}

export interface IPremiseConclusionRule extends IBaseRule {
  ruleType: 'premise-conclusion';
  premise: Quad[];
  conclusion: Quad[];
}

export type Rule = IRDFSRule | IOWL2RLRule | IPremiseConclusionRule;
