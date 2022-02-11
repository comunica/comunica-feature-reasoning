import * as fs from 'fs';
import * as path from 'path';
import { Rule } from '@comunica/bus-rule-parse';
import { Bus } from '@comunica/core';
import { defaultGraph, quad } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import { termAsQuad } from 'is-quad';
import { stringToTerm } from 'rdf-string';
import { ActorOptimizeRulePatternSubstitution } from '../lib/ActorOptimizeRulePatternSubstitution';

const OWL2RL = parseRules(fs.readFileSync(path.join(__dirname, 'data', 'owl2rl.hylar')).toString());

console.log(OWL2RL);

describe('ActorOptimizeRulePatternSubstitution', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorOptimizeRulePatternSubstitution instance', () => {
    let actor: ActorOptimizeRulePatternSubstitution;

    beforeEach(() => {
      actor = new ActorOptimizeRulePatternSubstitution({ name: 'actor', bus });
    });

    // It('should test', () => {
    //   return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    // });

    const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

  //   It('should run', () => {
  //     return expect(actor.run({ rules: [
  //       {
  //         premise: [ quad(
  //           variable('?u'),
  //           variable('?a'),
  //           variable('?y'),
  //           defaultGraph(),
  //         ) ],
  //         conclusion: [
  //           quad(
  //             variable('?u'),
  //             namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
  //             namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'),
  //             defaultGraph(),
  //           ),
  //         ],
  //       },
  //       {
  //         premise: [ quad(
  //           variable('?a'),
  //           namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#domain'),
  //           variable('?x'),
  //           defaultGraph(),
  //         ), quad(
  //           variable('?u'),
  //           variable('?a'),
  //           variable('?y'),
  //           defaultGraph(),
  //         ) ],
  //         conclusion: [
  //           quad(
  //             variable('?u'),
  //             namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
  //             variable('?x'),
  //             defaultGraph(),
  //           ),
  //         ],
  //       },
  //       {
  //         premise: [ quad(
  //           variable('?a'),
  //           namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#range'),
  //           variable('?x'),
  //           defaultGraph(),
  //         ), quad(
  //           variable('?u'),
  //           variable('?a'),
  //           variable('?y'),
  //           defaultGraph(),
  //         ) ],
  //         conclusion: [
  //           quad(
  //             variable('?y'),
  //             namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
  //             variable('?x'),
  //             defaultGraph(),
  //           ),
  //         ],
  //       },
  //       {
  //         premise: [ quad(
  //           variable('?u'),
  //           variable('?a'),
  //           variable('?y'),
  //           defaultGraph(),
  //         ) ],
  //         conclusion: [
  //           quad(
  //             variable('?y'),
  //             namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
  //             variable('?x'),
  //             defaultGraph(),
  //           ),
  //         ],
  //       },
  //     ]})).resolves.toMatchObject({ todo: true }); // TODO
  //   });
  });
});

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
  const premiseQuads = premise.match(/((?<=\()\S+?\s\S+?\s\S+?(?=\)))|false/gi);
  const conclusionQuads = conclusion.match(/((?<=\()\S+?\s\S+?\s\S+?(?=\)))|false/gi);

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

function myStringToTerm(value: string): RDF.Term {
  const prefixes: Record<string, string> = {
    owl: 'http://www.w3.org/2002/07/owl#',
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    hax: 'http://ucbl.github.io/HyLAR-Reasoner/axioms/',
  };

  const [ prefix ] = value.split(':');
  if (prefix in prefixes) {
    return stringToTerm(value.replace(new RegExp(`^${prefix}:`), prefixes[prefix]));
  }
  return stringToTerm(value);
}
