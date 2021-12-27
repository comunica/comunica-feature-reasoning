import { ActorRdfReason, ActorRdfReasonMediated, IActionRdfReason, IActorRdfReasonMediatedArgs, IActorRdfReasonOutput, IReason, IReasonOutput } from '@comunica/bus-rdf-reason';
import type { IQuadSource, IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput } from '@comunica/bus-rdf-resolve-quad-pattern'
import { ActionContext, Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
// import { incremental, factsToQuads, quadsToFacts } from 'hylar-core';
import type { AsyncIterator, ArrayIterator } from 'asynciterator';
import { fromArray, wrap, empty } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import * as RDF from 'rdf-js';
import { evaluateRuleSet } from './reasoner';
import { variable } from '@rdfjs/data-model'
import { Store } from 'n3';
import type { Algebra } from 'sparqlalgebrajs';
// const factory = new DataFactory<RDF.Quad>();

// function toArray<T>(stream: AsyncIterator<T>): Promise<T[]> {
//   return new Promise<T[]>((resolve, reject) => {
//     const array: T[] = [];
//     stream.on('data', data => array.push(data));
//     stream.on('error', reject);
//     stream.on('end', () => resolve(array));
//   });
// }

// function sourceToIterator(source: IQuadSource): AsyncIterator<RDF.Quad> {
//   return source.match(
//     factory.variable('?s'),
//     factory.variable('?p'),
//     factory.variable('?o'),
//     factory.variable('?g')
//   )
// }

// function sourceToArray(source: IQuadSource) {
//   return toArray(sourceToIterator(source))
// }

// async function hylarReason(params: IReason) {
//   const add = params.insertions ? quadsToFacts(await toArray(params.insertions)) : [];
//   const del = params.deletions ? quadsToFacts(await toArray(params.deletions)) : [];
//   const implicitQuads = quadsToFacts(await sourceToArray(params.implicitQuads));
//   const explicitQuads = quadsToFacts(await sourceToArray(params.source));
//   const { additions, deletions } = await incremental(add, del, explicitQuads, implicitQuads);
//   const { implicit: implicitAdditions, explicit: explicitAdditions } = factsToQuads(additions);
//   const { implicit: implicitDeletions, explicit: explicitDeletions } = factsToQuads(deletions);
//   return {
//     implicitAdditions: fromArray(implicitAdditions),
//     implicitDeletions: fromArray(implicitDeletions),
//     explicitAdditions: fromArray(explicitAdditions),
//     explicitDeletions: fromArray(explicitDeletions),
//   }
// }
import type { IQuadDestination } from '@comunica/bus-rdf-update-quads'
import { EventEmitter } from 'stream';

function wrapper(store: Store): IQuadSource & IQuadDestination & { size: number } {
  // @ts-ignore
  return new Proxy(store, {
    get(target, p) {
      switch(p) {
        case 'insert':
          return async (d: AsyncIterator<RDF.Quad>) => {
            await new Promise<void>((res, rej) => {
              d.on('data', (quad) => {
                target.addQuad(quad);
                // console.log(target)
              })
              d.on('end', () => {
                res()
              })
              d.on('error', (e) => {
                rej(e)
              });
              
            })
            // await new Promise<void>((res, rej) => {
            //   d.on('data', (quad: RDF.Quad) => {
            //     console.log('adding quad', quad)
            //     target.addQuad(quad);
            //   })
            //   .on('end', () => res())
            //   .on('err', (e) => rej(e));
            //   d.
            // })
            // console.log('Post import ...')
            return;
          };
        case 'size':
          return target.size;
        case 'match':
          return function(s: RDF.Term, p: RDF.Term, o: RDF.Term, g: RDF.Term) {
            // console.log('match called')
            return wrap(target.match(
              // @ts-ignore
              s.termType === 'Variable' ? undefined : s,
              p.termType === 'Variable' ? undefined : p,
              o.termType === 'Variable' ? undefined : o,
              g.termType === 'Variable' ? undefined : g,
            ))
          }
      }
      
    }
  })
}

async function myStore(data?: AsyncIterator<RDF.Quad>) {
  const store = wrapper(new Store())
  if (data) {
    await store.insert(data);
  }
  return store;
}

function awaitEvent(event: EventEmitter) {
  return new Promise<void>((res, rej) => {
    event.on('end', () => { res() });
    // event.on('finish', () => { res() });
    event.on('err', (e) => { rej(e) })
    // event.emit
  })
}

/**
 * A comunica Hylar Reasoner RDF Reason Actor.
 */
export class ActorRdfReasonHylar extends ActorRdfReasonMediated {
  // public readonly mediatorResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  // IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
  public constructor(args: IActorRdfReasonMediatedArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  // protected matchFactory(context: ActionContext) {
  //   return (pattern: Algebra.Pattern) => wrap<RDF.Quad>(this.mediatorRdfResolveQuadPattern.mediate({
  //     pattern,
  //     context
  //   }).then(({ data }) => data))
  // }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    const store = new Store();
    let size = 0;
    const context = ActorRdfReason.getContext(action.context);
    do {
      size = store.size;
      // @ts-ignore
      const quadStreamInsert = evaluateRuleSet(action.settings.rules, this.unionQuadSource(context).match)
        .map(data => {
          store.addQuad(data);
          return data;
        });
      await Promise.all([
        // awaitEvent(store.import(quadStreamInsert.clone())),
        this.runImplicitUpdate({ quadStreamInsert }, context)
      ])
    } while (store.size > size);
    
    return { implicitSource: ActorRdfReason.getImplicitSource(context) };
  }

  // public async reason(params: IReason): Promise<IReasonOutput> {
  //   const implicitQuads = empty<RDF.Quad>();
  //   let c = true;
  //   while (c) {
  //     c = false;
  //     const results = evaluateRuleSet(params.settings.rules, this.unionQuadSource(params.context).match);
  //     results.transform
  //   }
    
    
    
  //   // This is a union of the implicit and explicit sources
  //   const sources = this.unionQuadSource(params.context);
    
  //   // sources.match


  //   return {
  //     updates: {
  //       implicit: {
  //         insert: empty(),
  //         delete: empty(),
  //       },
  //       explicit: {
  //         insert: empty(),
  //         delete: empty(),
  //       }
  //     }
  //   };

  //   // async function evalLoop(restriction: (quad: RDF.Quad) => Promise<boolean>, evalMatch: Match, dataset: IQuadSource & IQuadDestination & { size: number }) {
  //   //   // console.log(1)
  //   //   let size: number;
  //   //   do {
  //   //     size = dataset.size;
  //   //     // console.log(2)
  //   //     // TODO - work out how to do promised based is signator
  //   //     // TODO - double check this filter works properly
  //   //     // TODO - run benchmarking on the usefulness of this particular rule restriction algorithm
  //   //     // @ts-ignore
  //   //     const restrictedRules = fromArray(rules).filter<RestrictableRule>(async (rule: Rule): rule is RestrictableRule => {
  //   //       if (rule.conclusion === false) {
  //   //         return false
  //   //       }
  
  //   //       for (const p of rule.premise) {
  //   //         if (!(await restriction(p))) {
  //   //           return false
  //   //         }
  //   //       }
  //   //       return true;
  //   //     })
  //   //     const changes = evaluateRuleSet(restrictedRules, evalMatch);
  //   //     await dataset.insert(changes);
  //   //   } while (dataset.size > size);
  //   // }
    
  //   // await evalLoop(deletionHas, matchUnion({ match: sourceMatch }, explicit.deletions), implicit.deletions);
  
  //   // function sourceMatchFiltered(...args: Parameters<Match>): ReturnType<Match> {
  //   //   return sourceMatch(...args).transform({
  //   //     async transform(quad: RDF.Quad, done: () => void, push: (quad: RDF.Quad) => void) {
  //   //       if (!(await deletionHas(quad))) {
  //   //         push(quad);
  //   //       }
  //   //       done();
  //   //     }
  //   //   });
  //   // }
  
  //   // await evalLoop(hasUnion(implicit.deletions), sourceMatchFiltered, implicit.additions)
  //   // await evalLoop(
  //   //   hasUnion({ match: sourceMatchFiltered }, explicit.additions, implicit.additions),
  //   //   matchUnion({ match: sourceMatchFiltered }, explicit.additions, implicit.additions),
  //   //   implicit.additions
  //   // )
  // }

  /**
   * @deprecated 
   */
  // public async reasonOld(params: IReason): Promise<IReasonOutput> {
  //   const data: Parameters<typeof incremental>[0] = {
  //     implicit: {
  //       source: params.sources.implicit,
  //       additions: await myStore(),
  //       deletions: await myStore(),
  //     },
  //     explicit: {
  //       source: params.sources.explicit,
  //       additions: await myStore(
  //         // params.updates.insert
  //         ),
  //       deletions: await myStore(
  //         // params.updates.delete
  //         ),
  //     },
  //     rules: params.settings.rules
  //   }
    
  //   await incremental(data)

  //   console.log(data.implicit.additions)

  //   return {
  //     updates: {
  //       implicit: {
  //         insert: data.implicit.additions.match(variable('?s'), variable('?p'), variable('?o'), variable('?g')),
  //         delete: data.implicit.deletions.match(variable('?s'), variable('?p'), variable('?o'), variable('?g')),
  //       },
  //       explicit: {
  //         insert: data.explicit.additions.match(variable('?s'), variable('?p'), variable('?o'), variable('?g')),
  //         delete: data.explicit.deletions.match(variable('?s'), variable('?p'), variable('?o'), variable('?g'))
  //       }
  //     }
  //   }
    
    
  //   // const reasoned = hylarReason(params)

  //   // function getWrapped(name: `${'implicit' | 'explicit'}${'Additions' | 'Deletions'}` ) {
  //   //   return wrap<RDF.Quad>(new Promise<ArrayIterator<RDF.Quad>>(async (resolve, reject) => { 
  //   //     try {
  //   //       resolve((await reasoned)[name])
  //   //     } catch (e) {
  //   //       reject(e);
  //   //     }
  //   //   }))
  //   // }

  //   // return {
  //   //   implicitInsertions: getWrapped('implicitAdditions'),
  //   //   implicitDeletions:  getWrapped('implicitDeletions'),
  //   //   explicitInsertions: getWrapped('explicitAdditions'),
  //   //   explicitDeletions:  getWrapped('explicitDeletions'),
  //   // }
    
  //   // const insertions = params.insertions ? quadsToFacts(await toArray(params.insertions)) : [];
  //   // return hylarReason(params);
  // }

  // public async test(action: IActionRdfReason): Promise<IActorTest> {
  //   return true; // TODO implement
  // }

  // public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
  //   return true; // TODO implement
  // }
}
