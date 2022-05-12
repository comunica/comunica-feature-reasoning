import { ActorRuleEvaluate, IActionRuleEvaluate, IActorRuleEvaluateArgs, IActorRuleEvaluateOutput } from '@comunica/bus-rule-evaluate';
import { IActorTest } from '@comunica/core';
import { INestedPremiseConclusionRule, Rule, IPremiseConclusionRule, INestedPremiseConclusionRuleBase } from '@comunica/reasoning-types';
import * as RDF from '@rdfjs/types';
import { AsyncIterator, single, UnionIterator, fromArray } from '../../actor-rdf-reason-forward-chaining/lib/asynciterator';
import { WrappingIterator, wrap } from '../../actor-rdf-reason-forward-chaining/lib/util';
import { DataFactory } from 'n3';
import { forEachTerms, mapTerms } from 'rdf-terms';
import { MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import { Algebra } from 'sparqlalgebrajs';

function countVars(quad: RDF.Quad): number {
  let i = 0;
  forEachTerms(quad, term => {
    if (term.termType === 'Variable') i += 1;
  });
  return i
}

/**
 * A comunica Restriction Rule Evaluate Actor.
 */
export class ActorRuleEvaluateRestriction extends ActorRuleEvaluate {
  public readonly mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern

  public constructor(args: IActorRuleEvaluateRestrictionArgs) {
    super(args);
  }

  public async test(action: IActionRuleEvaluate): Promise<IActorTest> {
    if (
      action.rule.ruleType === 'nested-premise-conclusion' ||
      action.rule.ruleType === 'premise-conclusion'
    ) return true;

    throw new Error('Unhandled rule type');
  }

  public async run(action: IActionRuleEvaluate): Promise<IActorRuleEvaluateOutput> {
    let rule = action.rule as INestedPremiseConclusionRule;
    
    

    // TODO: Possible remove this in future
    let premise = [ ...rule.premise ];
    premise = premise.sort((a, b) => countVars(a) - countVars(b))

    const mappings: AsyncIterator<Mapping> = premise.reduce(
      (iterator: AsyncIterator<Mapping>, premise) => new UnionIterator<Mapping>(iterator.map<AsyncIterator<Mapping>>(
        mapping => {
          const cause = substituteQuad(premise, mapping);

          return wrap<RDF.Quad>(this.mediatorRdfResolveQuadPattern.mediate({
            pattern: cause as any,
            context: action.context
          }).then(elem => elem.data), { letIteratorThrough: true, prioritizeIterable: true }).map(quad => {
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

            return localMapping && Object.assign(localMapping, mapping);
          });
        }
      )), single<Mapping>({})
    );

    // const results: any = new UnionIterator(mappings.map(mapping => fromArray(rule.conclusion).map(quad => substituteQuad(quad, mapping))), { autoStart: false });
    const results: any = new UnionIterator<RDF.Quad>(rule.conclusion.map(quad => (rule.conclusion.length > 1 ? mappings.clone() : mappings).map(mp => substituteQuad(quad, mp))));
      
      // mappings.map(mapping => fromArray(rule.conclusion).map(quad => substituteQuad(quad, mapping))), { autoStart: false });

    return { results }
  }

  
  // map(({ mappings, conclusion }) => new UnionIterator(
  //   conclusion.map(
  //     quad => (conclusion.length > 1 ? mappings.clone() : mappings).map(mapping => substituteQuad(quad, mapping)),
  //   ),
  //   { autoStart: false },
  // ))
}

export interface IActorRuleEvaluateRestrictionArgs extends IActorRuleEvaluateArgs {
  mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;
}

type Mapping = Record<string, RDF.Term>;

export function substituteQuad(term: RDF.Quad, mapping: Mapping): RDF.Quad {
  // TODO: Fix the as any required to meed the Algebra.Pattern requirement
  // Should be able to do this once https://github.com/comunica/comunica/issues/999 is resolved.
  return mapTerms(term, elem => elem.termType === 'Variable' && elem.value in mapping ? mapping[elem.value] : elem) as any;
}
