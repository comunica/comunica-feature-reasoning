import { ActorRdfReasonMediated, IActionRdfReason, IActionRdfReasonExecute, IActorRdfReasonMediatedArgs, setImplicitDestination, setUnionSource } from '@comunica/bus-rdf-reason';
import { getContextDestination, getDataDestinationValue } from '@comunica/bus-rdf-update-quads';
import { MediatorRdfUpdateQuadsInfo } from '@comunica/bus-rdf-update-quads-info';
import { MediatorRuleEvaluate } from '@comunica/bus-rule-evaluate';
import { IActorTest } from '@comunica/core';
import { IPremiseConclusionRule, Rule } from '@comunica/reasoning-types';
import { IActionContext } from '@comunica/types';
import * as RDF from '@rdfjs/types';
import { Store } from 'n3';
import { forEachTerms, mapTerms } from 'rdf-terms';
import { matchPatternMappings } from 'rdf-terms/lib/QuadTermUtil';
import { single } from './asynciterator';
import { ArrayIterator, AsyncIterator, fromArray, UnionIterator } from './asynciterator';
import { fromIterable, fromIterator, maybeIterator, wrap } from './util';
import { RdfJsQuadSource } from '@comunica/actor-rdf-resolve-quad-pattern-rdfjs-source';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries'

interface IRuleNode {
  rule: Rule;
  next: { rule: IRuleNode, index: number }[];
}

interface IConsequenceData {
  quads: AsyncIterator<RDF.Quad>;
  rule: IRuleNode;
}

// TODO: Use similar functions already developed
function substitute(quad: RDF.Quad, map:  Record<string, RDF.Term>): RDF.Quad {
  return mapTerms(quad, (term) => term.termType === 'Variable' && term.value in map ? map[term.value] : term);
}

function maybeSubstitute({ rule: { rule, next }, index }: { rule: IRuleNode, index: number }, quad: RDF.Quad): IRuleNode | null {
  let mapping: Record<string, RDF.Term> | null = {};
  const pattern = rule.premise[index];

  forEachTerms(pattern, (term, name) => {
    if (term.termType !== 'Variable') {
      // Verify that it is a valid match
      if (!term.equals(quad[name])) {
        mapping = null;
      return;
      }
    }

    if (mapping) {
      if (term.value in mapping) {
        if (!quad[name].equals(mapping[term.value])) {
          mapping = null;
        }
      } else {
        mapping[term.value] = quad[name];
      }
    }
  });

  if (mapping === null) {
    return null;
  }

  const premise: RDF.Quad[] = [];

  for (let i = 0; i < rule.premise.length; i++) {
    if (i !== index) {
      premise.push(substitute(rule.premise[i], mapping));
    }
  }

  const conclusion = rule.conclusion && rule.conclusion.map(conclusion => substitute(conclusion, mapping!));

  const res: IRuleNode = {
    rule: {
      // TODO: See if we can just use the existing rule type
      ruleType: 'rdfs',
      premise,
      conclusion
    },
    next
  }

  return res;
}

/**
 * A comunica Forward Chaining RDF Reason Actor.
 */
export class ActorRdfReasonForwardChaining extends ActorRdfReasonMediated {
  mediatorRuleEvaluate: MediatorRuleEvaluate;
  mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;

  public constructor(args: IActorRdfReasonForwardChainingArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async execute({ rules, context }: IActionRdfReasonExecute): Promise<void> {
    // TODO: Refactor this - I've already written something similar somewhere
    const nodes: IRuleNode[] = rules.map(rule => ({ rule, next: [] }));
    
    // Creating rule dependencies
    for (const n1 of nodes) {
      for (const n2 of nodes) {
        if (n1.rule.conclusion === false) {
          continue;
        }

        for (const conclusion of n1.rule.conclusion) {
          for (let i = 0; i < n2.rule.premise.length; i++) {
            const pattern = n2.rule.premise[i];
            if (matchPatternMappings(conclusion, pattern)) {
              n1.next.push({ rule: n2, index: i });
            }
          }

        }
      }
    }
  
    const store = context.get(KeysRdfResolveQuadPattern.source) as Store

    const nexts = []

    function runRule(rule: IRuleNode) {
      const next = [];
      for (const mapping of applyMappings(rule, store)) {
        for (const conclusion of rule.rule.conclusion || []) {
          const quad = substituteQuad(conclusion, mapping);
          if (store.addQuad(quad) as unknown as boolean) {
            next.push(quad);
          }
        }
      }
      if (next.length > 0) {
        return { rule, quads: next };
      }
    }

    for (const rule of nodes) {
      const res = runRule(rule);
      if (res)
        nexts.push(res)
    }
    

    let n;
    while ((n = nexts.pop()) !== undefined) {
      const { rule, quads } = n;
      for (const r of rule.next) {
        for (const quad of quads) {
          const s = maybeSubstitute(r, quad);
          if (s) {
            const run = runRule(s);
            if (run)
              nexts.push(run)
          }
        }
      }
    }
    return;
  }
}


    // nodes.map(rule => applyMappings(rule, store))
    // // let results: AsyncIterator<{ quad: RDF.Quad, rule: any }> | null = new UnionIterator(fromArray(nodes).map(rule => applyMappings(rule as any, store)).map(quads => quads.quads.map(quad => ({ quad, rule: quads.rule }))));
    
    // // if (results !== null)
    //   // await new UnionIterator(results).toArray()
    // while ((results = await maybeIterator(results)) !== null) {
    //   results = new UnionIterator(results.map(({ quads, rule }) => {
    //     return new UnionIterator(quads.map(quad => fromArray(rule.next).map(rule => maybeSubstitute(rule, quad))), { autoStart: false })
    //       .map(rule => applyMappings(rule as any, store));
    //   }), { autoStart: false });
    // }


export interface IActorRdfReasonForwardChainingArgs extends IActorRdfReasonMediatedArgs {
  mediatorRuleEvaluate: MediatorRuleEvaluate;
  mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;
}

type Mapping = Record<string, RDF.Term>;

export function substituteQuad(term: RDF.Quad, mapping: Mapping): RDF.Quad {
  // TODO: Fix the as any required to meed the Algebra.Pattern requirement
  // Should be able to do this once https://github.com/comunica/comunica/issues/999 is resolved.
  return mapTerms(term, elem => elem.termType === 'Variable' && elem.value in mapping ? mapping[elem.value] : elem) as any;
}

function applyMappings(rule: IRuleNode, store: Store): Mapping[] {
  return rule.rule.premise.reduce<Mapping[]>((m: Mapping[], premise) => {
    const mappings: Mapping[] = [];
    for (const mp of m) {
      const cause = substituteQuad(premise, mp);
      const match = store.match(
        RdfJsQuadSource.nullifyVariables(cause.subject) as any,
        RdfJsQuadSource.nullifyVariables(cause.predicate) as any,
        RdfJsQuadSource.nullifyVariables(cause.object) as any,
        RdfJsQuadSource.nullifyVariables(cause.graph) as any,
      );
      for (const quad of match) {
        let localMapping: Mapping | null = {};

          forEachTerms(cause, (term, key) => {
            if (term.termType === 'Variable' && localMapping) {
              if (term.value in localMapping && !localMapping[term.value].equals(quad[key])) {
                localMapping = null;
              } else {
                localMapping[term.value] = quad[key];
              }
            }
          });
          if (localMapping)
            mappings.push(Object.assign(localMapping, mp));
      }
    }
    return mappings;
  }, [{}])
}
