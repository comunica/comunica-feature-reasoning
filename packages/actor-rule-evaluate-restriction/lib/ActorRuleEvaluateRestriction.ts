import { ActorRuleEvaluate, IActionRuleEvaluate, IActorRuleEvaluateArgs, IActorRuleEvaluateOutput } from '@comunica/bus-rule-evaluate';
import { IActorTest } from '@comunica/core';
import { INestedPremiseConclusionRule, Rule, IPremiseConclusionRule, INestedPremiseConclusionRuleBase } from '@comunica/reasoning-types';
import * as RDF from '@rdfjs/types';
import { AsyncIterator, single, UnionIterator, wrap } from 'asynciterator';
import { DataFactory } from 'n3';
import { forEachTerms, mapTerms } from 'rdf-terms';
import { MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import { Algebra } from 'sparqlalgebrajs'

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
    let nestedRule = action.rule as INestedPremiseConclusionRule;

    const iterators = single(nestedRule).transform<{ mappings: AsyncIterator<Mapping>; conclusion: RDF.Quad[] }>({
      autoStart: false,
      transform: (rule: INestedPremiseConclusionRuleBase | undefined, done, push) => {
        let mappings: AsyncIterator<Mapping> = single({});
        while (rule) {
          mappings = rule.premise.reduce(
            (iterator, premise) => new UnionIterator(iterator.map(
              mapping => {
                const cause = substituteQuad(premise, mapping);

                return wrap<RDF.Quad>(this.mediatorRdfResolveQuadPattern.mediate({
                  pattern: cause as any,
                  context: action.context
                }).then(elem => elem.data)).map(quad => {
                  let localMapping: Mapping | undefined = {};
  
                  forEachTerms(cause, (term, key) => {
                    if (term.termType === 'Variable' && localMapping) {
                      if (term.value in localMapping && !localMapping[term.value].equals(quad[key])) {
                        localMapping = undefined;
                      } else {
                        localMapping[term.value] = quad[key];
                      }
                    }
                  });
  
                  return localMapping && Object.assign(localMapping, mapping);
                }).filter<Mapping>((_mapping): _mapping is Mapping => _mapping !== undefined);
              },
            ), { autoStart: false }),
            mappings,
          );
          push({
            conclusion: rule.conclusion,
            // The only time the mappings shouldn't be cloned is if the rules is
            // not nested at all
            mappings: nestedRule.next ? mappings.clone() : mappings,
          });
          // eslint-disable-next-line no-cond-assign
          if (rule = rule.next) {
            mappings = mappings.clone();
          }
        }
        done();
      },
    }).map(({ mappings, conclusion }) => new UnionIterator(
      conclusion.map(
        quad => (conclusion.length > 1 ? mappings.clone() : mappings).map(mapping => substituteQuad(quad, mapping)),
      ),
      { autoStart: false },
    ));
    return { results: new UnionIterator(iterators, { autoStart: false }) };
  }
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
