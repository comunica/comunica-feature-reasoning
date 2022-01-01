import { Actor, IAction, IActorArgs, IActorOutput, IActorTest, ActionContext as ActionContextConstructor, Mediator } from '@comunica/core';
import type { ActionContext } from '@comunica/types';
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from '@comunica/context-entries'
import type { IDataSource } from '@comunica/bus-rdf-resolve-quad-pattern'
import { Store } from 'n3';
// TODO: FIX
import { RestrictableRule, Rule } from '../../actor-rdf-reason-rule-restriction/lib/reasoner';
import { Algebra } from 'sparqlalgebrajs';

export enum KeysRdfReason {
  /**
   * @range {IDataDestination & IDataSource}
   */
  dataset = '@comunica/bus-rdf-reason:dataset',
  /**
   * @range {IDataSource?} // TODO: FIX
   */
  rules = '@comunica/bus-rdf-reason:rules',
}

export function getImplicitSource(context: ActionContext): IDataSource {
  return context.get(KeysRdfReason.dataset);
}

export function getExplicitSources(context: ActionContext): IDataSource[] {
  return context.get(KeysRdfResolveQuadPattern.source) ? [context.get(KeysRdfResolveQuadPattern.source)] : context.get(KeysRdfResolveQuadPattern.sources) ?? [];
}

export function getUnionSources(context: ActionContext): IDataSource[] {
  return [...getExplicitSources(context), getImplicitSource(context)];
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
  return _context.has(KeysRdfReason.dataset) ? _context : _context.set(KeysRdfReason.dataset, assign({ type: 'rdfjsSource' }, new Store()));
}

/**
 * Extends Object.assign by also copying prototype methods
 * @param {Object} props To add to the object
 * @param {Object} orig Original Object
 * @returns Copy of original object with added props
 */
 function assign(props: Object, orig: Object) {
  // https://stackoverflow.com/questions/41474986/how-to-clone-a-javascript-es6-class-instance
  return Object.assign(Object.create(orig), { ...orig, ...props });
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

export interface IActionRdfReason extends IAction {
  // rules?: RestrictableRule[]
  pattern?: Algebra.Pattern;
}

export interface IActorRdfReasonOutput extends IActorOutput {
  reasoned: Promise<void>
}

export type MediatorRdfReason = Mediator<Actor<IActionRdfReason, IActorTest,
  IActorRdfReasonOutput>, IActionRdfReason, IActorTest, IActorRdfReasonOutput>;
