import { ActorRuleParse, ActorRuleParseFixedMediaTypes, IActionRuleParse, IActorRuleParseOutput, Rule, IActorRuleParseFixedMediaTypesArgs } from '@comunica/bus-rule-parse';
import { IActorArgs, IActorTest } from '@comunica/core';
import { stringToTerm } from 'rdf-string';
import { termAsQuad } from 'is-quad';
import * as RDF from '@rdfjs/types';
import { defaultGraph, quad } from '@rdfjs/data-model';
// TODO: Remove this dependency
import toString = require('stream-to-string');
import streamify = require('streamify-array');
import { IActionAbstractMediaTyped } from '@comunica/actor-abstract-mediatyped';
import { ActionContext } from '@comunica/types';

/**
 * A comunica HyLAR Rule Parse Actor.
 */
export class ActorRuleParseHyLAR extends ActorRuleParseFixedMediaTypes {
  public constructor(args: IActorRuleParseFixedMediaTypesArgs) {
    super(args);
  }

  async testHandle(action: IActionRuleParse, mediaType: string, context: ActionContext): Promise<IActorTest> {
      return true;
  }

  public async runHandle(action: IActionRuleParse, mediaType: string, context: ActionContext):
  Promise<IActorRuleParseOutput> {
    const str = await toString(action.input);
    return { rules: streamify(str.split('\n').filter(x => x !== '').map(parseRule)) };
  }
}

const TRIPLE = /((?<=\()[^\s]+?\s[^\s]+?\s[^\s]+?(?=\)))|false/gi;

export function parseRule(strRule: string) {
  // TODO: Handle the following bugs:
  // 1. Will not parse correctly if '->', '^', '(' or ')' occurs in a string or url
  // Consider stream parsing like the N3 package instead
  // console.log('rule', strRule)
  const [premise, conclusion] = strRule.split('->');
  const premiseQuads = premise.match(TRIPLE);
  const conclusionQuads = conclusion.match(TRIPLE);

  if (premiseQuads === null || conclusionQuads === null) {
    throw new Error('Invalid rule: ' + strRule);
  }

  return new Rule(parseTriples(premiseQuads), conclusionQuads[0] === 'false' ? false : parseTriples(conclusionQuads));
}

export function parseTriples(triples: string[]): RDF.Quad[] {
  return triples.map((triple) => parseTriple(triple));
}

export function parseTriple(triple: string): RDF.Quad {
  const [s, p, o] = triple.split(' ');
  // TODO: Handle non-default graph cases
  return termAsQuad(quad(myStringToTerm(s), myStringToTerm(p), myStringToTerm(o), defaultGraph()));
}

const prefixes: {[key: string]: string} = {
  owl: 'http://www.w3.org/2002/07/owl#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  hax: 'http://ucbl.github.io/HyLAR-Reasoner/axioms/',
};

function myStringToTerm(value: string): RDF.Term {
  const [prefix] = value.split(':');
  if (prefix in prefixes) {
    return stringToTerm(value.replace(new RegExp(`^${prefix}:`), prefixes[prefix]));
  }
  return stringToTerm(value);
}
