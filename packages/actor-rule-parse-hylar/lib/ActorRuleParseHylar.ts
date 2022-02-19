import type { IActionRuleParse, IActorRuleParseOutput, IActorRuleParseFixedMediaTypesArgs } from '@comunica/bus-rule-parse';
import { ActorRuleParseFixedMediaTypes } from '@comunica/bus-rule-parse';
import type { Rule } from '@comunica/reasoning-types';
import type { IActorTest } from '@comunica/core';
import type { IActionContext } from '@comunica/types';
import { defaultGraph, quad } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import { termAsQuad } from 'is-quad';
import { stringToTerm } from 'rdf-string';
// TODO: Remove this dependency
import toString = require('stream-to-string');
import streamify = require('streamify-array');

/**
 * A comunica HyLAR Rule Parse Actor.
 */
export class ActorRuleParseHylar extends ActorRuleParseFixedMediaTypes {
  public constructor(args: IActorRuleParseFixedMediaTypesArgs) {
    super(args);
  }

  async testHandle(action: IActionRuleParse, mediaType: string, context: IActionContext): Promise<IActorTest> {
    return true;
  }

  public async runHandle(action: IActionRuleParse, mediaType: string, context: IActionContext):
  Promise<IActorRuleParseOutput> {
    const str = await toString(action.data);
    return { data: streamify(str.split('\n').filter(x => x !== '').map(parseRule)) };
  }
}

function parseRules(str: string) {
  return str.split('\n').filter(x => x !== '').map(parseRule);
}

const TRIPLE = /((?<=\()\S+?\s\S+?\s\S+?(?=\)))|false/gi;

export function parseRule(strRule: string) {
  // TODO: Handle the following bugs:
  // 1. Will not parse correctly if '->', '^', '(' or ')' occurs in a string or url
  // Consider stream parsing like the N3 package instead
  // console.log('rule', strRule)
  const [ premise, conclusion ] = strRule.split('->');
  const premiseQuads = premise.match(TRIPLE);
  const conclusionQuads = conclusion.match(TRIPLE);

  if (premiseQuads === null || conclusionQuads === null) {
    throw new Error(`Invalid rule: ${strRule}`);
  }

  return new Rule(parseTriples(premiseQuads), conclusionQuads[0] === 'false' ? false : parseTriples(conclusionQuads));
}

export function parseTriples(triples: string[]): RDF.Quad[] {
  return triples.map(triple => parseTriple(triple));
}

export function parseTriple(triple: string): RDF.Quad {
  const [ s, p, o ] = triple.split(' ');
  // TODO: Handle non-default graph cases
  return termAsQuad(quad(myStringToTerm(s), myStringToTerm(p), myStringToTerm(o), defaultGraph()));
}

const prefixes: Record<string, string> = {
  owl: 'http://www.w3.org/2002/07/owl#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  hax: 'http://ucbl.github.io/HyLAR-Reasoner/axioms/',
};

function myStringToTerm(value: string): RDF.Term {
  const [ prefix ] = value.split(':');
  if (prefix in prefixes) {
    return stringToTerm(value.replace(new RegExp(`^${prefix}:`), prefixes[prefix]));
  }
  return stringToTerm(value);
}
