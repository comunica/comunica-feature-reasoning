import { ActionContext as ActionContextConstructor, Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediator } from '@comunica/core';
import * as RDF from 'rdf-js';
import { type AsyncIterator, wrap } from 'asynciterator'
import type { IActionRdfResolveQuadPattern, IQuadSource, IActorRdfResolveQuadPatternOutput } from '@comunica/bus-rdf-resolve-quad-pattern'
import { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput, IDataDestination } from '@comunica/bus-rdf-update-quads';
import { termToString } from 'rdf-string'
import { Store } from 'n3';
import { Rule } from '@comunica/bus-rule-parse';
import { KeysRdfReason } from './Keys';
// import { Map } from 'immutable';
import { type ActionContext } from '@comunica/types'
import { Dataset } from '@rdfjs/types'
import type { Algebra } from 'sparqlalgebrajs';
import { KeysRdfUpdateQuads } from '@comunica/context-entries'
import { Map } from
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
  public readonly mediatorRdfUpdateQuads: Mediator<Actor<IActionRdfUpdateQuads, IActorTest,
  IActorRdfUpdateQuadsOutput>, IActionRdfUpdateQuads, IActorTest, IActorRdfUpdateQuadsOutput>;
  public readonly mediatorRdfResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
  
  public constructor(args: IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput>) {
    super(args);
  }

  // TODO [FUTURE]: Implement this using rdf-update-quads mediator
  // private async updateImplicit(data: QuadUpdates, context: ActionContext): Promise<void> {
  //   const { updateResult } = await this.mediatorRdfUpdateQuads.mediate({
  //     quadStreamInsert: data.insertions,
  //     quadStreamDelete: data.deletions,
  //     context: context.set(KeysRdfUpdateQuads.destination, context.get(KeysRdfReason.dataset))
  //   })
  //   return updateResult;
  // }

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

  protected async runExplicitUpdate(changes: IQuadChanges, context: ActionContext) {
    const { updateResult } = await this.mediatorRdfUpdateQuads.mediate({
      quadStreamInsert: changes.insert,
      quadStreamDelete: changes.delete,
      context: context
    });
    return updateResult;
  }

  protected setImplicitSource(context: ActionContext): ActionContext {
    return context.set(KeysRdfUpdateQuads.destination, context.get(KeysRdfReason.dataset));
  }

  protected async runImplicitUpdate(changes: IQuadChanges, context: ActionContext) {
    return this.runExplicitUpdate(changes, this.setImplicitSource(context));
  }

  protected async runUpdates(changes: IReasonOutput, context: ActionContext) {
    return Promise.all([
      this.runExplicitUpdate(changes.explicit, context),
      this.runImplicitUpdate(changes.implicit, context)
    ])
  }

  protected explicitQuadSource(context: ActionContext): IQuadSource {
    const match = (pattern: Algebra.Pattern): AsyncIterator<RDF.Quad> => {
      const data = this.mediatorRdfResolveQuadPattern.mediate({ context, pattern })
        .then(({ data }) => data);
      return wrap(data);
    }
    return { match };
  }

  protected implicitQuadSource(context: ActionContext): IQuadSource {
    return this.explicitQuadSource(this.setImplicitSource(context));
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    let context = action.context ?? ActionContextConstructor({});
    
    // const implicitDataset = this.getImplicitSource(action.context);
    
    // let context = action.context ?? ActionContext({});
    // context = context.has(KeysRdfReason.dataset) ? context : context.set(KeysRdfReason.dataset, new Store());

    // context.get(KeysRdfReason.dataset)
    
    
    // const dataset = context.has(KeysRdfReason.dataset);
    const match = () => {
      this.mediatorRdfResolveQuadPattern.mediate({
        context,

      });
    }

    
    // @ts-ignore
    const result = this.reason(action.params);

    return this.runUpdates(result, context);
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
  rules: Rule[];
  /**
   * True if the reasoner should be lazy, false otherwise
   */
  lazy: boolean;
  /**
   * Patterns which are being lazily matched against
   * Should be defined if lazy is true
   */
  patterns?: Algebra.Pattern[];
  /**
 * Patterns which *have already*
 * Should be defined if lazy is true *and* sourceReasoned is true
 */
  completedPatterns?: Algebra.Pattern[];
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

export interface IQuadChanges {
  insert: AsyncIterator<RDF.Quad>;
  delete: AsyncIterator<RDF.Quad>;
}


export interface IReasonOutput {
  implicit: IQuadChanges;
  explicit: IQuadChanges;
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
  settings: IReasonSettings 
}

export interface IActorRdfReasonOutput extends IActorOutput {

}

interface QuadUpdates {
  /**
   * Quads which are being added to the source
   */
  insertions?: AsyncIterator<RDF.Quad>;
  /**
   * Quads which are being deleted from the source
   */
  deletions?: AsyncIterator<RDF.Quad>;
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
