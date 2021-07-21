import { Actor, IAction, IActorArgs, IActorOutput, IActorTest } from '@comunica/core';
import * as RDF from 'rdf-js';
import type { AsyncIterator } from 'asynciterator'
import type { IQuadSource } from '@comunica/bus-rdf-resolve-quad-pattern'
import { termToString } from 'rdf-string'
import { Store } from 'n3';

// Development notes - the "apply reasoning results"

function toHash(iterator: AsyncIterator<string>): Promise<Record<string, boolean>> {
  return new Promise((resolve, reject) => {
    const hash: Record<string, boolean> = {};
    iterator.on('data', data => { hash[data] = true });
    iterator.on('error', err => { reject(err) });
    iterator.on('end', () => { resolve(hash) });
  })
}

/**
 * A comunica actor for RDF reasoners
 *
 * Actor types:
 * * Input:  IActionRdfReason:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorRdfReasonOutput: TODO: fill in.
 *
 * @see IActionRdfReason
 * @see IActorRdfReasonOutput
 */
export abstract class ActorRdfReason extends Actor<IActionRdfReason, IActorTest, IActorRdfReasonOutput> {
  public constructor(args: IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput>) {
    super(args);
  }

  // TODO [FUTURE]: Implement this using rdf-update-quads mediator
  private updateImplicit(data: QuadUpdates, store: Store): Promise<Store> {
    return new Promise((resolve, reject) => {
      store.remove(data.deletions).on('end', () => {
        store.import(data.insertions).on('end', () => {
          resolve(store);
        })
      })
    })
    // await store.import(data.insertions);
    // const hash = await toHash(data.deletions.map(termToString))
  }

  public abstract reason(data: QuadUpdates, source: IQuadSource): void

  
}

export interface IActionRdfReason extends IAction {

}

export interface IActorRdfReasonOutput extends IActorOutput {

}

interface QuadUpdates {
  insertions: AsyncIterator<RDF.Quad>;
  deletions: AsyncIterator<RDF.Quad>;
}
