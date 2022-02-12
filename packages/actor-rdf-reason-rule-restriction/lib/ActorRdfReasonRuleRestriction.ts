import type { MediatorOptimizeRule } from '@comunica/bus-optimize-rule';
import type { IActionRdfReason, IActorRdfReasonMediatedArgs, IActorRdfReasonOutput } from '@comunica/bus-rdf-reason';
import { ActorRdfReasonMediated, KeysRdfReason } from '@comunica/bus-rdf-reason';
import type { MediatorRuleDereference } from '@comunica/bus-rule-dereference';
import type { IActorTest } from '@comunica/core';
import type * as RDF from '@rdfjs/types';
import { single, UnionIterator, type AsyncIterator } from 'asynciterator';
import { Store } from 'n3';
import { forEachTerms, mapTerms } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';
import arrayifyStream = require('arrayify-stream');
import streamifyArray = require('streamify-array');

/**
 * A comunica actor that
 */
export class ActorRdfReasonRuleRestriction extends ActorRdfReasonMediated {
  public readonly mediatorRuleDereference: MediatorRuleDereference;
  public readonly mediatorOptimizeRule: MediatorOptimizeRule;
  public constructor(args: IActorRdfReasonRuleRestrictionArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    if (!action.context.has(KeysRdfReason.dataset) || !action.context.has(KeysRdfReason.dataset)) {
      throw new Error('Missing dataset or rule context');
    }
    return true; // TODO implement
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    const { context } = action;

    if (!context) {
      throw new Error('Context required for reasoning');
    }

    const store = new Store();
    let size = 0;
    // Console.log('rule dereference', this.mediatorRuleDereference)
    const d = await this.mediatorRuleDereference.mediate({ url: context.get(KeysRdfReason.data) });
    const originalRules = await arrayifyStream(d.rules);
    const { rules } = await this.mediatorOptimizeRule.mediate({ rules: originalRules, pattern: action.pattern });

    // Console.log(rules.length, originalRules.length)
    // console.log(r)
    // console.log(r[0].premise)
    // console.log(r[0].conclusion)
    // const rules: RestrictableRule[] = context.get(KeysRdfReason.rules) ?? [];

    do {
      size = store.size;
      const quadStreamInsert = evaluateRuleSet(rules as RestrictableRule[], this.unionQuadSource(context).match)
        .map(data => {
          store.addQuad(data);
          return data;
        });
      await this.runImplicitUpdate({ quadStreamInsert }, context);
      // Console.log('implicit size', size)
    } while (store.size > size);

    return {
      reasoned: Promise.resolve(),
    };
  }
}

interface IActorRdfReasonRuleRestrictionArgs extends IActorRdfReasonMediatedArgs {
  mediatorRuleDereference: MediatorRuleDereference;
  mediatorOptimizeRule: MediatorOptimizeRule;
}



type Match = (pattern: Algebra.Pattern | RDF.Quad) => AsyncIterator<RDF.Quad>;

type Mapping = Record<string, RDF.Term>;

interface NestedRule {
  premise: RDF.Quad[];
  conclusion: RDF.Quad[];
  next?: NestedRule;
}

export function evaluateRuleSet(rules: AsyncIterator<NestedRule> | NestedRule[], match: Match): AsyncIterator<RDF.Quad> {
  // Autostart needs to be false to prevent the iterator from ending before being consumed by rdf-update-quads
  // https://github.com/comunica/comunica/issues/904
  // https://github.com/RubenVerborgh/AsyncIterator/issues/25
  return new UnionIterator(rules.map((rule: NestedRule) => evaluateNestedThroughRestriction(rule, match)), { autoStart: false });
}

export function evaluateNestedThroughRestriction(nestedRule: NestedRule, match: Match): AsyncIterator<RDF.Quad> {
  return single(nestedRule).transform({
    transform(rule, done, push) {
      let mappings: AsyncIterator<Mapping> = single({});
      let _rule: NestedRule | undefined = rule;
      while (_rule) {
        mappings = rule.premise.reduce(
          (iterator, premise) => iterator.transform({ transform: transformFactory(match, premise) }),
          mappings,
        );
        push({
          conclusion: rule.conclusion,
          mapping: rule.next ? mappings.clone() : mappings,
        });
        _rule = rule.next;
      }
      done();
    },
  }).transform({
    transform({ mapping, conclusion }, done, push) {
      conclusion.forEach((quad: RDF.Quad) => {
        push(substituteQuad(mapping, quad));
      });
      done();
    },
  });
}

export interface T {
  premise: RDF.Quad;
  mapping: Mapping;
}

export function transformFactory(match: Match, premise: RDF.Quad) {
  return function transform(mapping: Mapping, done: () => void, push: (mapping: Mapping) => void) {
    const cause = substituteQuad(mapping, premise);
    match(unVar(cause, mapping)).forEach(quad => {
      const localMapping: Mapping = {};

      function factElemMatches(factElem: RDF.Term, causeElem: RDF.Term) {
        if (causeElem.termType === 'Variable' && factElem.termType !== 'Variable') {
          // TODO: end if causeElem.value in localMapping && !factElem.equals(localMapping[causeElem.value])
          localMapping[causeElem.value] = factElem;
        }
      }

      forEachTerms(quad, (term, key) => factElemMatches(term, cause[key]));

      // If an already existing uri has been mapped...
      // Merges local and global mapping
      for (const mapKey in mapping) {
        for (const key in localMapping) {
          // This is horribly innefficient, allow lookup in rev direction
          // This shouldn't even be necessary due to thefact that the variables are already substitued for in the cause
          if (mapping[mapKey] === localMapping[key] && mapKey !== key) {
            return;
          }
        }
        localMapping[mapKey] = mapping[mapKey];
      }
      // Console.log(localMapping)
      push(localMapping);
    });
    done();
  };
}

const unVarTerm = (term: RDF.Term, mapping: Mapping) => term.termType === 'Variable' && term.value in mapping ? mapping[term.value] : term;
const unVar = (quad: RDF.Quad, mapping: Mapping) => mapTerms(quad, elem => unVarTerm(elem, mapping));

export function substitute(elem: RDF.Term, mapping: Mapping): RDF.Term {
  return elem.termType === 'Variable' && elem.value in mapping ? mapping[elem.value] : elem;
}

export function substituteQuad(mapping: Mapping, term: RDF.Quad) {
  return mapTerms(term, elem => substitute(elem, mapping));
}
