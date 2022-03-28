import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';
import { Actor, ActionContext, ActionContextKey } from '@comunica/core';
import type { IActionContext, IDataDestination, IDataSource } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import type { AsyncIterator } from 'asynciterator';
import type { Algebra } from 'sparqlalgebrajs';

export type IDatasetFactory = () => IDataSource & IDataDestination;

export interface IReasonedSource {
  type: 'full';
  reasoned: true;
  done: Promise<void>;
}

export interface IUnreasonedSource {
  type: 'full';
  reasoned: false;
}

export interface IPartialReasonedStatus {
  type: 'partial';
  // TODO: Consider using term-map here
  patterns: Map<RDF.BaseQuad, IReasonStatus>;
}

export type IReasonStatus = IReasonedSource | IUnreasonedSource;

export interface IReasonGroup {
  dataset: IDataSource & IDataDestination;
  status: IReasonStatus | IPartialReasonedStatus;
  context: IActionContext;
}

export const KeysRdfReason = {
  /**
   * The data to reason over in the *current context*.
   */
  data: new ActionContextKey<IReasonGroup>('@comunica/bus-rdf-reason:data'),
  /**
   * The rules to use for reasoning in the *current context*
   */
  rules: new ActionContextKey<string>('@comunica/bus-rdf-reason:rules'),
  /**
   * A factory to generate new implicit datasets
   */
  implicitDatasetFactory: new ActionContextKey<IDatasetFactory>('@comunica/bus-rdf-reason:implicitDatasetFactory'),
};

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
    status: { type: 'full', reasoned: false },
    context: new ActionContext(),
  };
}

// TODO: Clean up after https://github.com/comunica/comunica/issues/945 is closed
export function getSafeData(context: IActionContext): IReasonGroup {
  const data: IReasonGroup | undefined = context.get(KeysRdfReason.data);
  if (!data) {
    throw new Error(`Context entry ${KeysRdfReason.data.name} is required but not available`);
  }
  return data;
}

export function getImplicitSource(context: IActionContext): IDataSource & IDataDestination {
  return getSafeData(context).dataset;
}

export function getExplicitSources(context: IActionContext): IDataSource[] {
  return context.has(KeysRdfResolveQuadPattern.source) ?
    [ context.get(KeysRdfResolveQuadPattern.source)! ] :
    context.get(KeysRdfResolveQuadPattern.sources) ?? [];
}

export function getUnionSources(context: IActionContext): IDataSource[] {
  return [ ...getExplicitSources(context), getImplicitSource(context) ];
}

export function setImplicitDestination(context: IActionContext): IActionContext {
  return context.set(KeysRdfUpdateQuads.destination, getImplicitSource(context));
}

export function setImplicitSource(context: IActionContext): IActionContext {
  return context
    .delete(KeysRdfResolveQuadPattern.sources)
    .set(KeysRdfResolveQuadPattern.source, getImplicitSource(context));
}

export function setUnionSource(context: IActionContext): IActionContext {
  return context.delete(KeysRdfResolveQuadPattern.source)
    .set(KeysRdfResolveQuadPattern.sources, getUnionSources(context));
}

export function getContextWithImplicitDataset(context: IActionContext): IActionContext {
  // We cannot use 'setDefault' here because implicitGroupFactory will throw an error
  // if there is no implicit dataset factory *even if* we already have a data entry
  return context.has(KeysRdfReason.data) ? context : context.set(KeysRdfReason.data, implicitGroupFactory(context));
}

export function setReasoningStatus(context: IActionContext, status: IReasonGroup['status']): IActionContext {
  getSafeData(context).status = status;
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
