import { Actor, IAction, IActorArgs, IActorOutput, IActorTest } from '@comunica/core';
import * as RDF from 'rdf-js';
import type { AsyncIterator } from 'asynciterator'
import type { IQuadSource } from '@comunica/bus-rdf-resolve-quad-pattern'
import { termToString } from 'rdf-string'
import { Store } from 'n3';
import { Rule } from '@comunica/bus-rule-parse';
import { KeysRdfReason } from './Keys';
// import { Map } from 'immutable';
import { ActionContext } from '@comunica/types'
import { Dataset } from '@rdfjs/types'

// Development notes - the "apply reasoning results"

function toHash(iterator: AsyncIterator<string>): Promise<Record<string, boolean>> {
  return new Promise((resolve, reject) => {
    const hash: Record<string, boolean> = {};
    iterator.on('data', data => { hash[data] = true });
    iterator.on('error', err => { reject(err) });
    iterator.on('end', () => { resolve(hash) });
  })
}

// Possibly create a couple of "convenience" abstract classes for Eager v. Lazy reasoners


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

  public abstract reason(params: IReason): IReasonOutput

  // /**
  //  * Get the sources from the given context.
  //  * @param {ActionContext} context An optional context.
  //  * @return {IDataSource[]} The array of sources or undefined.
  //  */
  // protected getContextSources(context?: ActionContext): DataSources | undefined {
  //   return context ? context.get(KeysRdfResolveQuadPattern.sources) : undefined;
  // }

  // TODO: Extend this to other types of source (potentially?)
  protected getImplicitSource(context?: ActionContext): Dataset {
    return context?.get(KeysRdfReason.dataset) ?? new Store();
  }


  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    const implicitDataset = this.getImplicitSource(action.context);
    
    // let context = action.context ?? ActionContext({});
    // context = context.has(KeysRdfReason.dataset) ? context : context.set(KeysRdfReason.dataset, new Store());

    // context.get(KeysRdfReason.dataset)
    
    
    // const dataset = context.has(KeysRdfReason.dataset);
    
    // @ts-ignore
    const result = this.reason(action.params);
    
    const {
      implicitDeletions,
      implicitInsertions,
      explicitDeletions,
      explicitInsertions
    } = result;

    if (result.implicitDeletions) {
      implicitDataset.difference(result.implicitDeletions).import(result.implicitInsertions);
    }

  }
}

/**
 * 
 */
export interface IReason {
  /**
   * Implicit Quads that have already been generated for the
   * source
   */
  implicitQuads: IQuadSource;
  /**
   * The source of the quads to be reasoned over
   */
  source: IQuadSource;
  /**
   * Quads which are being added to the source
   */
  insertions?: AsyncIterator<RDF.Quad>;
  /**
   * Quads which are being deleted from the source
   */
  deletions?: AsyncIterator<RDF.Quad>;
  /**
   * Settings for reasoning
   */
  settings: IReasonSettings;
}

// Note: The parameters relating to lazy evaluation are *highly* experimental at the moment.

// TODO: Work out if these are better suited to come from the 'context'
// or if they should be passed in as parameters
//
export interface IReasonSettings {
  /**
   * Whether the original data source has been fully reasoned over
   */
  sourceReasoned: boolean;
  /**
   * The rules to use for inferencing
   */
  rules?: Rule[];
  /**
 * True if the reasoner should be lazy, false otherwise
 */
  lazy: boolean;
  /**
   * Patterns which are being lazily matched against
   * Should be defined if lazy is true
   */
  patterns?: RDF.Quad[];
  /**
 * Patterns which *have already*
 * Should be defined if lazy is true *and* sourceReasoned is true
 */
  completedPatterns?: RDF.Quad[];
}

// export interface EagerReasonSettings extends IReasonSettings {
//   /**
//    * True if the reasoner should be lazy, false otherwise
//    */
//   lazy: false
// }

// export interface LazyReasonSettings extends IReasonSettings {
// /**
//  * True if the reasoner should be lazy, false otherwise
//  */
// lazy: true
// /**
//  * Patterns which are being lazily matched against
//  */
// patterns: RDF.Quad[];
// }



export interface IReasonOutput {
  implicitInsertions?: AsyncIterator<RDF.Quad>;
  implicitDeletions?: AsyncIterator<RDF.Quad>;
  explicitInsertions?: AsyncIterator<RDF.Quad>;
  explicitDeletions?: AsyncIterator<RDF.Quad>;
}

/**
 * Updates to the implicit sources
 */
interface ImplicitUpdates {
  /**
   * Addition to the implicit source
   */
  additions: AsyncIterator<RDF.Quad>;
  /**
   * Deletion from the implicit source
   */
  deletions: AsyncIterator<RDF.Quad>;
}

export interface IActionRdfReason extends IAction {
  updates: QuadUpdates
}

export interface IActorRdfReasonOutput extends IActorOutput {

}

interface QuadUpdates {
  /**
   * Quads which are being added to the source
   */
  insertions: AsyncIterator<RDF.Quad>;
  /**
   * Quads which are being deleted from the source
   */
  deletions: AsyncIterator<RDF.Quad>;
}

// TODO: Use context keys to specify the destination of inferenced quads rather than using
// inferenced by default
// Reference https://github.com/comunica/comunica/blob/master/packages/context-entries/lib/Keys.ts

// In terms of using standardised interfaces for rules and reasoning like https://github.com/rdfjs/types/issues/26
// we need to think about what part of these interfaces are quite specific to reasoners and what are more generic

// Plan:
// Get basic reasoning working
// Get support for a variety of reasoning 'flavours' (lazy, eager, incremental, etc)
// "Compartmentalize" reasoners to allow for actor-mediator-bus type builds 

// Design:
// As already is the case have a 'reasoning' source - however most of the time this should *already*
// be defined in the context

// Points of entry for reasoning
// 1. actor-rdf-resolve-quad-pattern-reasoned [starting point]
// 2. somewhere else (closer to init) so it is easier to have the eager evaluation at an earlier stage?
// 3. On top of the update quads interface to allow for incremental eager evaluation
