import type { IQuadSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import type { IQuadDestination } from '@comunica/bus-rdf-update-quads';
import { quad } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import { type AsyncIterator, single, UnionIterator } from 'asynciterator';
// Import { ActorRdfResolveQuadPatternReasoned } from '../../actor-rdf-resolve-quad-pattern-reasoned';
// import { Store } from 'n3'
import type { Algebra } from 'sparqlalgebrajs';

// Type Match = IQuadSource['match'];
type Match = (pattern: Algebra.Pattern) => AsyncIterator<RDF.Quad>;

export interface Rule {
  premise: RDF.Quad[];
  conclusion: RDF.Quad[] | false;
}

export interface RestrictableRule extends Rule {
  premise: RDF.Quad[];
  conclusion: RDF.Quad[];
}

type Mapping = Record<string, RDF.Term>;

export interface Args {
  implicit: {
    source: IQuadSource;
    additions: IQuadSource & IQuadDestination & { size: number };
    deletions: IQuadSource & IQuadDestination & { size: number };
  };
  explicit: {
    source: IQuadSource;
    additions: IQuadSource;
    deletions: IQuadSource;
  };
  rules: Rule[];
}

export function evaluateRuleSet(rules: AsyncIterator<RestrictableRule> | RestrictableRule[], match: Match): AsyncIterator<RDF.Quad> {
  // Autostart needs to be false to prevent the iterator from ending before being consumed by rdf-update-quads
  // https://github.com/comunica/comunica/issues/904
  // https://github.com/RubenVerborgh/AsyncIterator/issues/25
  return new UnionIterator(rules.map((rule: RestrictableRule) => evaluateThroughRestriction(rule, match)), { autoStart: false });
}

export function evaluateThroughRestriction(rule: RestrictableRule, match: Match): AsyncIterator<RDF.Quad> {
  // This can be done in parallel
  return getMappings(rule, match).transform({
    transform(mapping, done, push) {
      // Console.log('transforming mapping', mapping)
      rule.conclusion.forEach(quad => {
        // Console.log('pushing', quad, mapping, substituteQuad(mapping, quad))
        push(substituteQuad(mapping, quad));
      });
      done();
    },
  });
}

export interface T {
  cause: RDF.Quad;
  mapping: Mapping;
}

export function transformFactory(match: Match) {
  return function transform({ cause, mapping }: T, done: () => void, push: (mapping: Mapping) => void) {
    // Console.log('---', mapping, cause)

    // const unVar = (term: RDF.Term) => term.termType === 'Variable' && term.value in mapping ? mapping[term.value] : term;
    const unVar = (term: RDF.Term) => term.termType === 'Variable' && term.value in mapping ? mapping[term.value] : term;

    const q = quad(
      // @ts-expect-error
      unVar(cause.subject), unVar(cause.predicate), unVar(cause.object), unVar(cause.graph),
    );

    // This can be done in parallel
    const data = match(
      quad(
        unVar(cause.subject), unVar(cause.predicate), unVar(cause.object), unVar(cause.graph),
      ),
    );
    data.on('data', quad => {
      // Console.log(q, quad, mapping)
      const localMapping: Mapping = {};

      function factElemMatches(factElem: RDF.Term, causeElem: RDF.Term) {
        if (causeElem.termType === 'Variable' && factElem.termType !== 'Variable') {
          // TODO: end if causeElem.value in localMapping && !factElem.equals(localMapping[causeElem.value])
          localMapping[causeElem.value] = factElem;
        }
      }

      factElemMatches(quad.predicate, cause.predicate);
      factElemMatches(quad.object, cause.object);
      factElemMatches(quad.subject, cause.subject);
      factElemMatches(quad.graph, cause.graph);

      // If an already existing uri has been mapped...
      // Merges local and global mapping
      for (const mapKey in mapping) {
        for (const key in localMapping) {
          // This is horribly innefficient, allow lookup in rev direction
          if (mapping[mapKey] === localMapping[key] && mapKey !== key) {
            return;
          }
        }
        localMapping[mapKey] = mapping[mapKey];
      }
      // Console.log(localMapping)
      push(localMapping);
    });

    data.on('end', () => {
      done();
    });
  };
}

export function getMappings(rule: Rule, match: Match) {
  let currentCauses: AsyncIterator<T> = single<T>({ cause: rule.premise[0], mapping: {}});

  for (const nextCause of rule.premise.slice(1)) {
    // TODO: Filter out duplicate mappings if that seems like a problem
    // If we do this then we can track quads that are *actually* new and and use the data aware rule filter
    // to filter out those quads 
    currentCauses = currentCauses.transform<Mapping>({ transform: transformFactory(match) }).transform({
      transform(mapping, done, push) {
        push({
          cause: substituteQuad(mapping, nextCause),
          mapping,
        });
        done();
      },
    });
  }

  return currentCauses.transform<Mapping>({ transform: transformFactory(match) });
}

export function substitute(elem: RDF.Term, mapping: Mapping): RDF.Term {
  // TODO: See if this is necessary
  // if (elem.termType === 'BlankNode') return blankNode();
  if (elem.termType === 'Variable') {
    if (!(elem.value in mapping)) {
      return elem;
      throw new Error('Variable not found in mapping');
    }
    return mapping[elem.value];
  }
  return elem;
}

export function substituteQuad(mapping: Mapping, term: RDF.Quad) {
  // Console.log('evaluating mapping', mapping)
  return quad(
    // @ts-expect-error
    substitute(term.subject, mapping),
    substitute(term.predicate, mapping),
    substitute(term.object, mapping),
    substitute(term.graph, mapping),
  );
}
