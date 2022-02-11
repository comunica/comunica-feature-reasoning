import type * as RDF from '@rdfjs/types';
import { single, UnionIterator, type AsyncIterator, union } from 'asynciterator';
import { forEachTerms, mapTerms } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';

type Match = (pattern: Algebra.Pattern | RDF.Quad) => AsyncIterator<RDF.Quad>;

type Mapping = Record<string, RDF.Term>;

interface NestedRule {
  premise: RDF.Quad[];
  conclusion: RDF.Quad[];
  requiredVariables?: Record<string, boolean>;
  next?: NestedRule;
}

// Do {
//   size = store.size;
//   const quadStreamInsert = evaluateRuleSet(rules as RestrictableRule[], this.unionQuadSource(context).match)
//     .map(data => {
//       store.addQuad(data);
//       return data;
//     });
//   await this.runImplicitUpdate({ quadStreamInsert }, context);
//   // Console.log('implicit size', size)
// } while (store.size > size);

export function evaluateRuleSet(rules: AsyncIterator<NestedRule> | NestedRule[], match: Match): AsyncIterator<RDF.Quad> {
  // Autostart needs to be false to prevent the iterator from ending before being consumed by rdf-update-quads
  // https://github.com/comunica/comunica/issues/904
  // https://github.com/RubenVerborgh/AsyncIterator/issues/25
  return new UnionIterator(rules.map((rule: NestedRule) => evaluateNestedThroughRestriction(rule, match)), { autoStart: false });
}

function hashMapping(mapping: Mapping) {
  let str = '';
  for (const key in mapping) {
    str += `${mapping[key].value} `;
  }
  return str;
}

export function evaluateNestedThroughRestriction(nestedRule: NestedRule, match: Match, startMappings: AsyncIterator<Mapping> = single({})): AsyncIterator<RDF.Quad> {
  return single(nestedRule).transform({
    transform(rule, done, push) {
      let mappings = startMappings;
      let _rule: NestedRule | undefined = rule;
      while (_rule) {
        const hash: Record<string, boolean> = {};
        mappings = _rule.premise.reduce(
          (iterator, premise) => union(iterator.map(mapFactory(match, premise, _rule?.requiredVariables ?? {}))).filter(
            // This should be useful if and only if not all variables are required
            mapping => {
              const h = hashMapping(mapping);
              return !(h in hash) && (hash[h] = true);
            },
          ),
          mappings,
        );
        push({
          conclusion: rule.conclusion,
          // TODO: See if mappings needs to be cloned
          mapping: _rule.next ? mappings.clone() : mappings,
        });
        _rule = rule.next;
      }
      done();
    },
  }).transform({
    transform({ mapping, conclusion }, done, push) {
      // TODO: possibly push mappings here so that they can be re-used
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

export function mapFactory(match: Match, premise: RDF.Quad, requiredVariables: Record<string, boolean>) {
  return (mapping: Mapping) => {
    const cause = substituteQuad(mapping, premise);
    return match(unVar(cause, mapping)).map(quad => {
      const localMapping: Mapping = { ...mapping };

      forEachTerms(cause, (term, key) => {
        if (term.termType === 'Variable' && (!requiredVariables || requiredVariables[term.value])) {
          localMapping[cause.value] = quad[key];
        }
      });

      // May have jumped the gun a little by skipping the key overlap check - match needs to match against variables rather than undefined for that to work

      return localMapping;
    });
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
