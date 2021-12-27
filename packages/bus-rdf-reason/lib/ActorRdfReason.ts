import { ActionContext as ActionContextConstructor, Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediator } from '@comunica/core';
import * as RDF from 'rdf-js';
import { type AsyncIterator, wrap } from 'asynciterator'
import type { IActionRdfResolveQuadPattern, IQuadSource, IActorRdfResolveQuadPatternOutput, IDataSource } from '@comunica/bus-rdf-resolve-quad-pattern'
import { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput, IDataDestination } from '@comunica/bus-rdf-update-quads';
import { termToString } from 'rdf-string'
import { Store } from 'n3';
import { Rule } from '@comunica/bus-rule-parse';
import { KeysRdfReason } from './Keys';
// import { Map } from 'immutable';
import { type ActionContext } from '@comunica/types'
import { Dataset } from '@rdfjs/types'
import type { Algebra } from 'sparqlalgebrajs';
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries'
  // Development notes - the "apply reasoning results"

  // function toHash(iterator: AsyncIterator<string>): Promise<Record<string, boolean>> {
  //   return new Promise((resolve, reject) => {
  //     const hash: Record<string, boolean> = {};
  //     iterator.on('data', data => { hash[data] = true });
  //     iterator.on('error', err => { reject(err) });
  //     iterator.on('end', () => { resolve(hash) });
  //   })
  // }

// Possibly create a couple of "convenience" abstract classes for Eager v. Lazy reasoners
type D = IDataDestination & IDataSource

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
  // public readonly mediatorRdfUpdateQuads: Mediator<Actor<IActionRdfUpdateQuads, IActorTest,
  //   IActorRdfUpdateQuadsOutput>, IActionRdfUpdateQuads, IActorTest, IActorRdfUpdateQuadsOutput>;
  // public readonly mediatorRdfResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  //   IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;

  public constructor(args: IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput>) {
    super(args);
  }

  // TODO: Extend this to other types of source (potentially?)
  static getImplicitSource(context: ActionContext): IQuadSource {
    return context.get(KeysRdfReason.dataset);
  }

  static getExplicitSources(context: ActionContext): IQuadSource[] {
    return context.get(KeysRdfResolveQuadPattern.source) ? [context.get(KeysRdfResolveQuadPattern.source)] : context.get(KeysRdfResolveQuadPattern.sources) ?? [];
  }

  static getUnionSources(context: ActionContext): IQuadSource[] {
    return [...this.getExplicitSources(context), this.getImplicitSource(context)];
  }

  static setImplicitDestination(context: ActionContext): ActionContext {
    return context.set(KeysRdfUpdateQuads.destination, context.get(KeysRdfReason.dataset));
  }

  static setImplicitSource(context: ActionContext): ActionContext {
    // TODO: Check if sources need to be handled
    return context.set(KeysRdfResolveQuadPattern.source, context.get(KeysRdfReason.dataset));
  }

  static setUnionSource(context: ActionContext): ActionContext {
    return context.delete(KeysRdfResolveQuadPattern.source).set(KeysRdfResolveQuadPattern.sources, this.getUnionSources(context));
  }

  static getContext(context?: ActionContext) {
    const _context = context ?? ActionContextConstructor({});
    return _context.has(KeysRdfReason.dataset) ? _context : _context.set(KeysRdfReason.dataset, new Store());
  }
}

export interface IReasonSources {
  /**
   * Implicit Quads that have already been generated for the
   * source
   */
  implicit: IQuadSource;
  /**
    * The source of the quads to be reasoned over
    */
  explicit: IQuadSource;
}

export interface IQuadUpdates {
  /**
   * Quads which are being added to the source
   */
   quadStreamInsert?: AsyncIterator<RDF.Quad>;
  /**
   * Quads which are being deleted from the source
   */
   quadStreamDelete?: AsyncIterator<RDF.Quad>;
}

/**
 * 
 */
export interface IReason {
  sources: IReasonSources;
  updates: IQuadUpdates;
  /**
   * Settings for reasoning
   */
  settings: IReasonSettings;
  context: ActionContext;
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

export interface IQuadUpdates {
  quadStreamInsert?: AsyncIterator<RDF.Quad>;
  quadStreamDelete?: AsyncIterator<RDF.Quad>;
}


export interface IReasonOutput {
  updates: {
    implicit: IQuadUpdates;
    explicit: IQuadUpdates;
  }
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
  updates: IQuadUpdates
  settings: IReasonSettings
}

export interface IActorRdfReasonOutput extends IActorOutput {
  implicitSource: IDataSource;
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
