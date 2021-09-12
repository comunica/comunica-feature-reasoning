import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput, IReason, IReasonOutput } from '@comunica/bus-rdf-reason';
import type { IQuadSource } from '@comunica/bus-rdf-resolve-quad-pattern'
import { IActorArgs, IActorTest } from '@comunica/core';
import { incremental, factsToQuads, quadsToFacts } from 'hylar-core';
import type { AsyncIterator, ArrayIterator } from 'asynciterator';
import { fromArray, wrap } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import * as RDF from 'rdf-js';


const factory = new DataFactory<RDF.Quad>();

function toArray<T>(stream: AsyncIterator<T>): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    const array: T[] = [];
    stream.on('data', data => array.push(data));
    stream.on('error', reject);
    stream.on('end', () => resolve(array));
  });
}

function sourceToIterator(source: IQuadSource): AsyncIterator<RDF.Quad> {
  return source.match(
    factory.variable('?s'),
    factory.variable('?p'),
    factory.variable('?o'),
    factory.variable('?g')
  )
}

function sourceToArray(source: IQuadSource) {
  return toArray(sourceToIterator(source))
}

async function hylarReason(params: IReason) {
  const add = params.insertions ? quadsToFacts(await toArray(params.insertions)) : [];
  const del = params.deletions ? quadsToFacts(await toArray(params.deletions)) : [];
  const implicitQuads = quadsToFacts(await sourceToArray(params.implicitQuads));
  const explicitQuads = quadsToFacts(await sourceToArray(params.source));
  const { additions, deletions } = await incremental(add, del, explicitQuads, implicitQuads);
  const { implicit: implicitAdditions, explicit: explicitAdditions } = factsToQuads(additions);
  const { implicit: implicitDeletions, explicit: explicitDeletions } = factsToQuads(deletions);
  return {
    implicitAdditions: fromArray(implicitAdditions),
    implicitDeletions: fromArray(implicitDeletions),
    explicitAdditions: fromArray(explicitAdditions),
    explicitDeletions: fromArray(explicitDeletions),
  }
}

/**
 * A comunica Hylar Reasoner RDF Reason Actor.
 */
export class ActorRdfReasonHylar extends ActorRdfReason {
  public constructor(args: IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput>) {
    super(args);
  }

  public reason(params: IReason): IReasonOutput {
    const reasoned = hylarReason(params)

    function getWrapped(name: `${'implicit' | 'explicit'}${'Additions' | 'Deletions'}` ) {
      return wrap<RDF.Quad>(new Promise<ArrayIterator<RDF.Quad>>(async (resolve, reject) => { 
        try {
          resolve((await reasoned)[name])
        } catch (e) {
          reject(e);
        }
      }))
    }

    return {
      implicitInsertions: getWrapped('implicitAdditions'),
      implicitDeletions:  getWrapped('implicitDeletions'),
      explicitInsertions: getWrapped('explicitAdditions'),
      explicitDeletions:  getWrapped('explicitDeletions'),
    }
    
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
