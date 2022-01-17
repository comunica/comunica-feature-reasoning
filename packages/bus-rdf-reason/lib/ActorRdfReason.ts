import type { IDataSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { IAction, IActorArgs, IActorOutput, IActorTest, Mediator } from '@comunica/core';
import { Actor, ActionContext as ActionContextConstructor } from '@comunica/core';
import type { ActionContext } from '@comunica/types';
import { Store } from 'n3';
// TODO: FIX
import type { Algebra } from 'sparqlalgebrajs';
import * as RDF from '@rdfjs/types'
import { AsyncIterator } from 'asynciterator'

interface IReasonedSource {
  reasoned: true;
  done: Promise<void>;
}

interface IUnreasonedSource {
  reasoned: false;
}

type IReasonStatus = IReasonedSource | IUnreasonedSource;

export enum KeysRdfReason {
  /**
   * @range {IDataDestination & IDataSource}
   */
  dataset = '@comunica/bus-rdf-reason:dataset',
  /**
  //  * @range {Rule[]} // TODO: FIX
   * @range {string}
   */
  rules = '@comunica/bus-rdf-reason:rules',
  /**
   * @range {IReasonStatus}
   */
  status = '@comunica/bus-rdf-reason:status',
}

export function getImplicitSource(context: ActionContext): IDataSource {
  return context.get(KeysRdfReason.dataset);
}

export function getExplicitSources(context: ActionContext): IDataSource[] {
  return context.get(KeysRdfResolveQuadPattern.source) ? [ context.get(KeysRdfResolveQuadPattern.source) ] : context.get(KeysRdfResolveQuadPattern.sources) ?? [];
}

export function getUnionSources(context: ActionContext): IDataSource[] {
  return [ ...getExplicitSources(context), getImplicitSource(context) ];
}

export function setImplicitDestination(context: ActionContext): ActionContext {
  return context.set(KeysRdfUpdateQuads.destination, context.get(KeysRdfReason.dataset));
}

export function setImplicitSource(context: ActionContext): ActionContext {
  return context.set(KeysRdfResolveQuadPattern.source, context.get(KeysRdfReason.dataset));
}

export function setUnionSource(context: ActionContext): ActionContext {
  return context.delete(KeysRdfResolveQuadPattern.source).set(KeysRdfResolveQuadPattern.sources, getUnionSources(context));
}

export function getContextWithImplicitDataset(context?: ActionContext): ActionContext {
  const _context = context ?? ActionContextConstructor({});
  return _context.has(KeysRdfReason.dataset) ? _context : _context.set(KeysRdfReason.dataset, { type: 'rdfjsSource', value: new Store() });
}

export function setContextReasoning<T>(context: ActionContext, promise: Promise<T>): ActionContext {
  return context.set(KeysRdfReason.status, { reasoned: true, done: promise.then(() => {}) })
}

/**
 * A comunica actor for reasoning over RDF data
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
}

export interface IQuadUpdates {
  quadStreamInsert?: AsyncIterator<RDF.Quad>;
  quadStreamDelete?: AsyncIterator<RDF.Quad>;
}

export interface IActionRdfReason extends IAction {
  // Rules?: RestrictableRule[]
  pattern?: Algebra.Pattern;
  updates?: IQuadUpdates;
}

export interface IActorRdfReasonOutput extends IActorOutput {
  reasoned: Promise<void>;
}

export type MediatorRdfReason = Mediator<Actor<IActionRdfReason, IActorTest,
IActorRdfReasonOutput>, IActionRdfReason, IActorTest, IActorRdfReasonOutput>;
