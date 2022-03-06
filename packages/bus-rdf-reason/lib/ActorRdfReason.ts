import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';
import { Actor, ActionContext, ActionContextKey } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import type { IActionContext, IDataDestination, IDataSource } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import type { AsyncIterator } from 'asynciterator';
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

interface IReasonPattern {
  pattern: RDF.BaseQuad;
}

interface IReasonData {
  dataset: IDataSource & IDataDestination;
  status?: IReasonStatus;
  rules?: Rule[];
  context: IActionContext;
}

export interface IReasonGroup {
  // Data?: IReasonData;
  // context: IActionContext;
  dataset: IDataSource & IDataDestination;
  status: IReasonStatus;
  // Rules?: Rule[];
  context: IActionContext;
}

type IDatasetFactory = () => IDataSource & IDataDestination;

export const KeysRdfReason = {
  /**
   * The data to reason over in the *current context*.
   */
  data: new ActionContextKey<IReasonGroup>('@comunica/bus-rdf-reason:data'),
  /**
   * Groups to reason over
   */
  groups: new ActionContextKey<IReasonGroup[]>('@comunica/bus-rdf-reason:groups'),
  /**
   * The rules to use for reasoning in the *current context*
   * TODO: Make this capable of more things (i.e. be more like IDataSource)
   */
  rules: new ActionContextKey<string>('@comunica/bus-rdf-reason:rules'),
  /**
   * A factory to generate new implicit datasets
   */
  implicitDatasetFactory: new ActionContextKey<IDatasetFactory>('@comunica/bus-rdf-reason:implicitDatasetFactory')
};

export function getReasonGroups(context: IActionContext): IReasonGroup[] {
  return context.get(KeysRdfReason.groups) ?? [];
}

export function implicitDatasetFactory(context: IActionContext): IDataSource & IDataDestination {
  const datasetFactory = context.get<IDatasetFactory>(KeysRdfReason.implicitDatasetFactory);
  if (!datasetFactory) {
    throw new Error(`Missing context entry for ${KeysRdfReason.implicitDatasetFactory.name}`);
  }
  return datasetFactory();
}

export function implicitGroupFactory(context: IActionContext): IReasonGroup {
  return {
    dataset: implicitDatasetFactory(context),
    status: { reasoned: false },
    context: new ActionContext(),
  };
}

// Generates a set of new contexts for each of the reasoning groups
export function getReasonGroupsContexts(context: IActionContext): IActionContext[] {
  return getReasonGroups(context).map(group => reasonGroupContext(context, group));
}

export function reasonGroupContext(context: IActionContext, group: IReasonGroup): IActionContext {
  const newContext = context.delete(KeysRdfReason.groups).merge(group.context);
  // TODO: Probably need to clear out old source and source(s) at this stage
  return newContext.set(KeysRdfReason.data, implicitGroupFactory(context));

  // TODO: Work out how to add rules and status properly here
  // const data: IReasonData = group.data ??= { dataset: implicitDatasetFactory(newContext) };
  // return newContext.set(KeysRdfReason.data, data);

  // Const groups = getReasonGroups(context);
  // groups.push(group);
  // return context.put(KeysRdfReason.groups, groups);
}

export function getImplicitSource(context: IActionContext): IDataSource & IDataDestination {
  const data: IReasonData | undefined = context.get(KeysRdfReason.data);
  if (!data) {
    throw new Error('Missing data in context');
  }

  return data.dataset;
}

export function getExplicitSources(context: IActionContext): IDataSource[] {
  return context.has(KeysRdfResolveQuadPattern.source) ? [ context.get(KeysRdfResolveQuadPattern.source)! ] : context.get(KeysRdfResolveQuadPattern.sources) ?? [];
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

export function getReasoningData(context: IActionContext): IReasonGroup | undefined {
  return context.get(KeysRdfReason.data);
}

export function getContextWithImplicitDataset(context: IActionContext): IActionContext {
  return context.setDefault(KeysRdfReason.data, implicitGroupFactory(context));
}

export function setContextReasoning<T>(context: IActionContext, promise: Promise<T>): IActionContext {
  const data = getReasoningData(context);
  if (!data) {
    throw new Error('Data is required to set reasoning context');
  }
  data.status = { reasoned: true, done: promise.then(() => {}) };
  return context;
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
  /**
   * The patterns for which must have all inferred data 
   * 
   * If left undefined then all inferences on the data need to be made
   */
  pattern?: Algebra.Pattern;
  /**
   * 
   */
  updates?: IQuadUpdates;
}

export interface IActorRdfReasonOutput extends IActorOutput {
  /**
   * Async function that resolves when the reasoning is done.
   */
  execute: () => Promise<void>;
}

export type MediatorRdfReason = Mediate<IActionRdfReason, IActorRdfReasonOutput>;
