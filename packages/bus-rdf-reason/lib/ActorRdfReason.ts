import type { Rule } from '@comunica/bus-rule-parse';
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';
import { Actor, ActionContext, ActionContextKey } from '@comunica/core';
import type { IActionContext, IDataDestination, IDataSource } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import type { AsyncIterator } from 'asynciterator';
import { Store } from 'n3';
// TODO: FIX
import type { Algebra } from 'sparqlalgebrajs';

interface IReasonedSource {
  reasoned: true;
  done: Promise<void>;
}

interface IUnreasonedSource {
  reasoned: false;
}

type IReasonStatus = IReasonedSource | IUnreasonedSource;

interface IReasonData {
  dataset: IDataSource & IDataDestination;
  status?: IReasonStatus;
  rules?: Rule[];
}

interface IReasonGroup {
  data?: IReasonData;
  context: IActionContext;
}

export const KeysRdfReason = {
  /**
   * The data to reason over in the *current context*.
   */
  data: new ActionContextKey<IReasonData>('@comunica/bus-rdf-reason:data'),
  /**
   * Groups to reason over
   */
  groups: new ActionContextKey<IReasonGroup[]>('@comunica/bus-rdf-reason:groups'),
  /**
   * A factory to generate new implicit datasets
   */
  implicitDatasetFactory: new ActionContextKey<() => IDataSource & IDataDestination>('@comunica/bus-rdf-reason:implicitDatasetFactory'),
}

export function getReasonGroups(context: IActionContext): IReasonGroup[] {
  return context.get(KeysRdfReason.groups) ?? [];
}

export function newImplicitDataset(context: IActionContext): IDataSource & IDataDestination {
  return context.get(KeysRdfReason.implicitDatasetFactory)();
}

// Generates a set of new contexts for each of the reasoning groups
export function getReasonGroupsContexts(context: IActionContext): IActionContext[] {
  return getReasonGroups(context).map(group => reasonGroupContext(context, group));
}

export function reasonGroupContext(context: IActionContext, group: IReasonGroup): IActionContext {
  const newContext = context.remove(KeysRdfReason.groups).merge(group.context);
  // TODO: Probably need to clear out old source and source(s) at this stage

  // TODO: Work out how to add rules and status properly here
  const data: IReasonData = group.data ??= { dataset: newImplicitDataset(newContext) };
  return newContext.set(KeysRdfReason.data, data);

  // Const groups = getReasonGroups(context);
  // groups.push(group);
  // return context.put(KeysRdfReason.groups, groups);
}


export function getImplicitSource(context: IActionContext): IDataSource & IDataDestination {
  return context.get(KeysRdfReason.data).dataset;
  // Return context.get(KeysRdfReason.dataset);
}

export function getExplicitSources(context: IActionContext): IDataSource[] {
  return context.get(KeysRdfResolveQuadPattern.source) ? [ context.get(KeysRdfResolveQuadPattern.source) ] : context.get(KeysRdfResolveQuadPattern.sources) ?? [];
}

export function getUnionSources(context: IActionContext): IDataSource[] {
  return [ ...getExplicitSources(context), getImplicitSource(context) ];
}

export function setImplicitDestination(context: IActionContext): IActionContext {
  return context.set(KeysRdfUpdateQuads.destination, getImplicitSource(context));
}

export function setImplicitSource(context: IActionContext): IActionContext {
  return context.set(KeysRdfResolveQuadPattern.source, getImplicitSource(context));
}

export function setUnionSource(context: IActionContext): IActionContext {
  return context.delete(KeysRdfResolveQuadPattern.source).set(KeysRdfResolveQuadPattern.sources, getUnionSources(context));
}

export function getContextWithImplicitDataset(context?: IActionContext): IActionContext {
  const _context = context ?? new ActionContext({});
  return _context.has(KeysRdfReason.dataset) ? _context : _context.set(KeysRdfReason.dataset, { type: 'rdfjsSource', value: new Store() });
}

export function setContextReasoning<T>(context: IActionContext, promise: Promise<T>): IActionContext {
  return context.set(KeysRdfReason.status, { reasoned: true, done: promise.then(() => {}) });
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

export type MediatorRdfReason = Mediate<IActionRdfReason, IActorRdfReasonOutput>;
