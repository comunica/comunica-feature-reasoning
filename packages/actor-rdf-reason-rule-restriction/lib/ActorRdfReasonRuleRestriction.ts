import type { IActionRdfReason, IActionRdfReasonExecute, IActorRdfReasonMediatedArgs } from '@comunica/bus-rdf-reason';
import { ActorRdfReasonMediated, KeysRdfReason } from '@comunica/bus-rdf-reason';
import type { IActorTest } from '@comunica/core';
import type * as RDF from '@rdfjs/types';
import { single, UnionIterator, AsyncIterator, TransformIterator, BufferedIterator } from 'asynciterator';
import { promisifyEventEmitter } from 'event-emitter-promisify/dist';
import { Store } from 'n3';
import { forEachTerms, mapTerms } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';

/**
 * A comunica actor that
 */
export class ActorRdfReasonRuleRestriction extends ActorRdfReasonMediated {
  public constructor(args: IActorRdfReasonRuleRestrictionArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    if (!action.context.has(KeysRdfReason.data) || !action.context.has(KeysRdfReason.rules)) {
      throw new Error('Missing dataset or rule context');
    }
    return true;
  }

  public async execute(action: IActionRdfReasonExecute): Promise<void> {
    const { context } = action;
    const store = new Store();
    let size = 0;
    do {
      size = store.size;
      // TODO: Handle rule assertions better
      const quadStreamInsert = evaluateRuleSet(action.rules as any, this.unionQuadSource(context).match)
      const { execute } = await this.runImplicitUpdate({ quadStreamInsert: quadStreamInsert.clone(), context });
      await Promise.all([execute(), await promisifyEventEmitter(store.import(quadStreamInsert.clone()))]);
    } while (store.size > size);
  };
}

interface IActorRdfReasonRuleRestrictionArgs extends IActorRdfReasonMediatedArgs {
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
  let mappings: AsyncIterator<Mapping> = single({});
  
  
  
  
  
  
  const iterators = single(nestedRule).transform<{ mappings: AsyncIterator<Mapping>, conclusion: RDF.Quad[] }>({
    autoStart: false,
    transform(rule: NestedRule | undefined, done, push) {
      let mappings: AsyncIterator<Mapping> = single({});
      while (rule) {
        mappings = rule.premise.reduce(
          (iterator, premise) => new UnionIterator(iterator.map(
            mapping => {
              const cause = substituteQuad(premise, mapping);
              return match(cause).map(quad => {
                let localMapping: Mapping | undefined = {};

                forEachTerms(cause, (term, key) => {
                  if (term.termType === 'Variable' && localMapping)
                    if (key in localMapping && localMapping[key] !== term)
                      localMapping = undefined
                    else
                      localMapping[term.value] = quad[key];
                });

                return localMapping && Object.assign(localMapping, mapping);
              }).filter<Mapping>((mapping): mapping is Mapping => mapping !== undefined)
            }
          ), { autoStart: false }),
          mappings,
        );
        push({
          conclusion: rule.conclusion,
          mappings: (rule = rule.next) ? mappings.clone() : mappings,
        });
      }
      done();
    },
  }).map(({ mappings, conclusion }) => new UnionIterator(conclusion.map(quad => mappings.map(mapping => substituteQuad(quad, mapping))), { autoStart: false }));
  return new UnionIterator(iterators, { autoStart: false });
}

export interface T {
  premise: RDF.Quad;
  mapping: Mapping;
}

// export function transformFactory(match: Match, premise: RDF.Quad) {
//   return async function transform(mapping: Mapping, done: () => void, push: (mapping: Mapping) => void) {
//     const cause = substituteQuad(premise, mapping);
//     console.log('the cause is', cause, mapping, await match(cause).toArray())
//     match(cause).forEach(quad => {
//       const localMapping: Mapping = {};

//       forEachTerms(cause, (term, key) => {
//         if (term.termType === 'Variable')
//           localMapping[term.value] = quad[key];
//       });

//       // If an already existing uri has been mapped...
//       // Merges local and global mapping
//       for (const mapKey in mapping) {
//         for (const key in localMapping) {
//           // This is horribly innefficient, allow lookup in rev direction
//           // This shouldn't even be necessary due to thefact that the variables are already substitued for in the cause
//           if (mapping[mapKey] === localMapping[key] && mapKey !== key) {
//             return;
//           }
//         }
//         localMapping[mapKey] = mapping[mapKey];
//       }

//       console.log('pushing mapping', localMapping);

//       push(localMapping);
//     });
//     done();
//   };
// }

export function substituteQuad(term: RDF.Quad, mapping: Mapping) {
  return mapTerms(term, elem => (elem.termType === 'Variable' && elem.value in mapping) ? mapping[elem.value] : elem);
}
