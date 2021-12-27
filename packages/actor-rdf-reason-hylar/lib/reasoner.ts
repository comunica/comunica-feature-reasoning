import type * as RDF from '@rdfjs/types';
import { quad, blankNode, namedNode } from '@rdfjs/data-model';
import { type AsyncIterator, single, union, fromArray, wrap, empty } from 'asynciterator';
import type { IQuadSource, ActorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern'
import type { IQuadDestination } from '@comunica/bus-rdf-update-quads'
import { ActorRdfResolveQuadPatternReasoned } from '../../actor-rdf-resolve-quad-pattern-reasoned';
// import { Store } from 'n3'
import { Algebra } from 'sparqlalgebrajs'

// type Match = IQuadSource['match'];
type Match = (pattern: RDF.Quad) => AsyncIterator<RDF.Quad>

export interface Rule {
  premise: RDF.Quad[];
  conclusion: RDF.Quad[] | false;
}

interface RestrictableRule extends Rule {
  premise: RDF.Quad[];
  conclusion: RDF.Quad[];
}

interface Mapping { [key: string]: RDF.Term }

export interface Args {
  implicit: {
    source: IQuadSource,
    additions: IQuadSource & IQuadDestination & { size: number },
    deletions: IQuadSource & IQuadDestination & { size: number },
  },
  explicit: {
    source: IQuadSource,
    additions: IQuadSource,
    deletions: IQuadSource
  },
  rules: Rule[]
}

function matchUnion(...matchers: { match: Match }[]): Match {
  return (...args: Parameters<Match>) => {
    // TODO: LONG TERM, remove wrap here [should not be needed if an actual AsyncIterator is returned in the first place as opposed to the stream that is returned by the N3 store]
    return union(matchers.map(m => m.match(...args)));
  }
}

function matchToHas(source: { match: Match }): (quad: RDF.Quad) => Promise<boolean> {
  return (quad: RDF.Quad) => new Promise<boolean>((res, rej) => {
    source.match(quad)
    .on('data', () => { res(true) })
    .on('end', () => { res(false) })
    .on('err', e => { rej(e) })
  });
}

function hasUnion(...sources: { match: Match }[]): (quad: RDF.Quad) => Promise<boolean> {
  return async (quad: RDF.Quad) => {
    for (const source of sources) {
      if (await matchToHas(source)(quad)) {
        return true;
      }
    }
    return false;
  }
}

// export async function incremental({ implicit, explicit, rules }: Args): Promise<void> {
//   // return;
//   // WORKS
//   // await implicit.additions.insert(empty());

//   await implicit.additions.insert(single(quad(
//     namedNode('http://example.org#jesse'),
//     namedNode('http://example.org#a'),
//     namedNode('http://example.org#person')
//   )));

//   // await implicit.additions.insert(single(quad(
//   //   namedNode('http://example.org#jesse'),
//   //   namedNode('http://example.org#a'),
//   //   namedNode('http://example.org#person')
//   // )));

//   return;

//   const sourceMatch = matchUnion(implicit.source, explicit.source);
//   const deletionHas = hasUnion(implicit.deletions, explicit.deletions);
  
//   async function evalLoop(restriction: (quad: RDF.Quad) => Promise<boolean>, evalMatch: Match, dataset: IQuadSource & IQuadDestination & { size: number }) {
//     // console.log(1)
//     let size: number;
//     do {
//       size = dataset.size;
//       // console.log(2)
//       // TODO - work out how to do promised based is signator
//       // TODO - double check this filter works properly
//       // TODO - run benchmarking on the usefulness of this particular rule restriction algorithm
//       // @ts-ignore
//       const restrictedRules = fromArray(rules).filter<RestrictableRule>(async (rule: Rule): rule is RestrictableRule => {
//         if (rule.conclusion === false) {
//           return false
//         }

//         for (const p of rule.premise) {
//           if (!(await restriction(p))) {
//             return false
//           }
//         }
//         return true;
//       })
//       const changes = evaluateRuleSet(restrictedRules, evalMatch);
//       await dataset.insert(changes);
//     } while (dataset.size > size);
//   }
  
//   await evalLoop(deletionHas, matchUnion({ match: sourceMatch }, explicit.deletions), implicit.deletions);

//   function sourceMatchFiltered(...args: Parameters<Match>): ReturnType<Match> {
//     return sourceMatch(...args).transform({
//       async transform(quad: RDF.Quad, done: () => void, push: (quad: RDF.Quad) => void) {
//         if (!(await deletionHas(quad))) {
//           push(quad);
//         }
//         done();
//       }
//     });
//   }

//   await evalLoop(hasUnion(implicit.deletions), sourceMatchFiltered, implicit.additions)
//   await evalLoop(
//     hasUnion({ match: sourceMatchFiltered }, explicit.additions, implicit.additions),
//     matchUnion({ match: sourceMatchFiltered }, explicit.additions, implicit.additions),
//     implicit.additions
//   )
// }

export function evaluateRuleSet(rules: AsyncIterator<RestrictableRule> | RestrictableRule[], match: Match): AsyncIterator<RDF.Quad> {
  return union(rules.map((rule: RestrictableRule) => evaluateThroughRestriction(rule, match)));
}

export function evaluateThroughRestriction(rule: RestrictableRule, match: Match): AsyncIterator<RDF.Quad> {
  // This can be done in parallel
  return getMappings(rule, match).transform({
    transform(mapping, done, push) {
      rule.conclusion.forEach(quad => { push(substituteQuad(mapping, quad)) });
      done();
    }
  })
}

export interface T {
  cause: RDF.Quad,
  mapping: Mapping
}

export function transformFactory(match: Match) {
  return function transform({ cause, mapping }: T, done: () => void, push: (mapping: Mapping) => void) {

    // const unVar = (term: RDF.Term) => term.termType === 'Variable' && term.value in mapping ? mapping[term.value] : term;
    const unVar = (term: RDF.Term) => term.termType === 'Variable' && term.value in mapping ? mapping[term.value] : term;

    // This can be done in parallel
    const data = match(
      quad(
        // @ts-ignore
        unVar(cause.subject), unVar(cause.predicate), unVar(cause.object), unVar(cause.graph)
      )
    )
    data.on('data', quad => {
      const localMapping: Mapping = {};

      function factElemMatches(factElem: RDF.Term, causeElem: RDF.Term) {
        if (causeElem.termType === 'Variable') {
          localMapping[causeElem.value] = factElem;
        }
      }
    
      factElemMatches(quad.predicate, cause.predicate)
      factElemMatches(quad.object, cause.object)
      factElemMatches(quad.subject, cause.subject)
      factElemMatches(quad.graph, cause.graph)
    
      // If an already existing uri has been mapped...
      // Merges local and global mapping
      for (const mapKey in mapping) {
        for (const key in localMapping) {
          // This is horribly innefficient, allow lookup in rev direction
          if (mapping[mapKey] === localMapping[key] && mapKey !== key) return;
        }
        localMapping[mapKey] = mapping[mapKey];
      }
      // console.log('about to push', localMapping, quad, cause)
      push(localMapping);
    })

    data.on('end', () => { done() });
  }
}

export function getMappings(rule: Rule, match: Match) {
  let currentCauses: AsyncIterator<T> = single<T>({ cause: rule.premise[0], mapping: {} })

  for (const nextCause of rule.premise.slice(1)) {
    // TODO: Filter out duplicate mappings if that seems like a problem
    currentCauses = currentCauses.transform<Mapping>({ transform: transformFactory(match) }).map(mapping => ({
      cause: substituteQuad(mapping, nextCause),
      mapping
    }))
  }

  return currentCauses.transform<Mapping>({ transform: transformFactory(match) });
}

export function substitute(elem: RDF.Term, mapping: Mapping): RDF.Term {
  // TODO: See if this is necessary
  if (elem.termType === 'BlankNode') return blankNode();
  if (elem.termType === 'Variable') {
    if (!(elem.value in mapping)) {
      throw new Error('Variable not found in mapping');
    }
    return mapping[elem.value];
  }
  return elem;
}

export function substituteQuad(mapping: Mapping, term: RDF.Quad) {
  return quad(
    // @ts-ignore
    substitute(term.subject, mapping),
    substitute(term.predicate, mapping),
    substitute(term.object, mapping),
    substitute(term.graph, mapping),
  );
}
