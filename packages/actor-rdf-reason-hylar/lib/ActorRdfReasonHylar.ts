import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput, IReason, IReasonOutput } from '@comunica/bus-rdf-reason';
import type { IQuadSource, IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput } from '@comunica/bus-rdf-resolve-quad-pattern'
import { Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
// import { incremental, factsToQuads, quadsToFacts } from 'hylar-core';
import type { AsyncIterator, ArrayIterator } from 'asynciterator';
import { fromArray, wrap } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import * as RDF from 'rdf-js';
import { incremental } from './reasoner';
import { variable } from '@rdfjs/data-model'
import { Store } from 'n3'
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

function wrapper(store: Store): IQuadSource & IQuadDestination & { size: number } {
  // @ts-ignore
  return new Proxy(store, {
    get(target, p) {
      switch(p) {
        case 'insert':
          return target.import;
        case 'size':
          return target.size;
        case ''
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

/**
 * A comunica Hylar Reasoner RDF Reason Actor.
 */
export class ActorRdfReasonHylar extends ActorRdfReason {
  public readonly mediatorResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
  public constructor(args: IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput>) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async reason(params: IReason): Promise<IReasonOutput> {
    const data: Parameters<typeof incremental>[0] = {
      implicit: {
        source: params.sources.implicit,
        additions: await myStore(),
        deletions: await myStore(),
      },
      explicit: {
        source: params.sources.explicit,
        additions: await myStore(params.updates.insert),
        deletions: await myStore(params.updates.delete),
      },
      rules: params.settings.rules
    }
    
    await incremental(data)

    return {
      updates: {
        implicit: {
          insert: data.implicit.additions.match(variable('?s'), variable('?p'), variable('?o'), variable('?g')),
          delete: data.implicit.deletions.match(variable('?s'), variable('?p'), variable('?o'), variable('?g')),
        },
        explicit: {
          insert: data.explicit.additions.match(variable('?s'), variable('?p'), variable('?o'), variable('?g')),
          delete: data.explicit.deletions.match(variable('?s'), variable('?p'), variable('?o'), variable('?g'))
        }
      }
    }
    
    
    // const reasoned = hylarReason(params)

    // function getWrapped(name: `${'implicit' | 'explicit'}${'Additions' | 'Deletions'}` ) {
    //   return wrap<RDF.Quad>(new Promise<ArrayIterator<RDF.Quad>>(async (resolve, reject) => { 
    //     try {
    //       resolve((await reasoned)[name])
    //     } catch (e) {
    //       reject(e);
    //     }
    //   }))
    // }

    // return {
    //   implicitInsertions: getWrapped('implicitAdditions'),
    //   implicitDeletions:  getWrapped('implicitDeletions'),
    //   explicitInsertions: getWrapped('explicitAdditions'),
    //   explicitDeletions:  getWrapped('explicitDeletions'),
    // }
    
    // const insertions = params.insertions ? quadsToFacts(await toArray(params.insertions)) : [];
    // return hylarReason(params);
  }

  // public async test(action: IActionRdfReason): Promise<IActorTest> {
  //   return true; // TODO implement
  // }

  // public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
  //   return true; // TODO implement
  // }
}
