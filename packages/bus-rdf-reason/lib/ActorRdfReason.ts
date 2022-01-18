import type { IDataSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import type { IDataDestination } from '@comunica/bus-rdf-update-quads';
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { IAction, IActorArgs, IActorOutput, IActorTest, Mediator } from '@comunica/core';
import { Actor, ActionContext as ActionContextConstructor } from '@comunica/core';
import type { ActionContext } from '@comunica/types';
import { Store } from 'n3';
// TODO: FIX
import type { Algebra } from 'sparqlalgebrajs';
import * as RDF from '@rdfjs/types'
import { AsyncIterator } from 'asynciterator'
import { Rule } from '@comunica/bus-rule-parse';

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
  context: ActionContext;
}

type DatasetFactory = () => IDataSource & IDataDestination;

export enum KeysRdfReason {
  /**
   * The data to reason over in the *current context*.
   * @range {IReasonData}
   */
  data = '@comunica/bus-rdf-reason:data',
  /**
   * Groups to reason over
   * @range {IReasonGroup[]}
   */
  groups = '@comunica/bus-rdf-reason:groups',
  /**
   * @range {DatasetFactory}
   */
  implicitDatasetFactory = '@comunica/bus-rdf-reason:implicitDatasetFactory',
}

export function getReasonGroups(context: ActionContext): IReasonGroup[] {
  return context.get(KeysRdfReason.groups) ?? [];
}

export function newImplicitDataset(context: ActionContext): IDataSource & IDataDestination {
  return context.get(KeysRdfReason.implicitDatasetFactory)()
}

// Generates a set of new contexts for each of the reasoning groups
export function getReasonGroupsContexts(context: ActionContext): ActionContext[] {
  return getReasonGroups(context).map(group => reasonGroupContext(context, group));
}

export function reasonGroupContext(context: ActionContext, group: IReasonGroup): ActionContext {
  const newContext = context.remove(KeysRdfReason.groups).merge(group.context);
  // TODO: Probably need to clear out old source and source(s) at this stage

  // TODO: Work out how to add rules and status properly here
  const data: IReasonData = group.data ??= { dataset: newImplicitDataset(newContext) };
  return newContext.set(KeysRdfReason.data, data);




  
  
  
  // const groups = getReasonGroups(context);
  // groups.push(group);
  // return context.put(KeysRdfReason.groups, groups);
}




// export enum KeysRdfReason {
//   /**
//    * @range {IDataDestination & IDataSource}
//    */
//   dataset = '@comunica/bus-rdf-reason:dataset',
//   /**
//   //  * @range {Rule[]} // TODO: FIX
//    * @range {string}
//    */
//   rules = '@comunica/bus-rdf-reason:rules',
//   /**
//    * @range {IReasonStatus}
//    */
//   status = '@comunica/bus-rdf-reason:status',
// }

export function getImplicitSource(context: ActionContext): IDataSource & IDataDestination {
  return context.get(KeysRdfReason.data).dataset;
  // return context.get(KeysRdfReason.dataset);
}

export function getExplicitSources(context: ActionContext): IDataSource[] {
  return context.get(KeysRdfResolveQuadPattern.source) ? [ context.get(KeysRdfResolveQuadPattern.source) ] : context.get(KeysRdfResolveQuadPattern.sources) ?? [];
}

export function getUnionSources(context: ActionContext): IDataSource[] {
  return [ ...getExplicitSources(context), getImplicitSource(context) ];
}

export function setImplicitDestination(context: ActionContext): ActionContext {
  return context.set(KeysRdfUpdateQuads.destination, getImplicitSource(context));
}

export function setImplicitSource(context: ActionContext): ActionContext {
  return context.set(KeysRdfResolveQuadPattern.source, getImplicitSource(context));
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
