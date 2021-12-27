import type { IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput, IQuadSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import type { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput } from '@comunica/bus-rdf-update-quads';
import type { Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
// import { Map } from 'immutable';
import { type ActionContext } from '@comunica/types';
import { wrap, type AsyncIterator } from 'asynciterator';
import * as RDF from 'rdf-js';
import type { Algebra } from 'sparqlalgebrajs';
import { IActionRdfReason, IActorRdfReasonOutput, IQuadUpdates, IReason, IReasonOutput, IReasonSources, ActorRdfReason } from './ActorRdfReason';

// TODO: Separate out the 'run' helper function
export abstract class ActorRdfReasonMediated extends ActorRdfReason implements IActorRdfReasonMediatedArgs {
  public readonly mediatorRdfUpdateQuads: Mediator<Actor<IActionRdfUpdateQuads, IActorTest,
    IActorRdfUpdateQuadsOutput>, IActionRdfUpdateQuads, IActorTest, IActorRdfUpdateQuadsOutput>;
  public readonly mediatorRdfResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
    IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>; 

  public constructor(args: IActorRdfReasonMediatedArgs) {
    super(args);
  }

  public reason(params: IReason): Promise<IReasonOutput> {
    throw new Error('Reason not implemented')
  }

  protected async runExplicitUpdate(changes: IQuadUpdates, context: ActionContext) {
    const { updateResult } = await this.mediatorRdfUpdateQuads.mediate({
      quadStreamInsert: changes.quadStreamInsert,
      quadStreamDelete: changes.quadStreamDelete,
      context: context
    });
    return updateResult;
  }

  protected async runImplicitUpdate(changes: IQuadUpdates, context: ActionContext) {
    return this.runExplicitUpdate(changes, ActorRdfReasonMediated.setImplicitDestination(context));
  }

  protected async runUpdates({ updates }: IReasonOutput, context: ActionContext) {
    return Promise.all([
      this.runExplicitUpdate(updates.explicit, context),
      this.runImplicitUpdate(updates.implicit, context)
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
    return this.explicitQuadSource(ActorRdfReasonMediated.setImplicitSource(context));
  }

  protected unionQuadSource(context: ActionContext): IQuadSource {
    return this.explicitQuadSource(ActorRdfReasonMediated.setUnionSource(context));
  }

  protected quadSources(context: ActionContext): IReasonSources {
    return {
      explicit: this.explicitQuadSource(context),
      implicit: this.implicitQuadSource(context)
    }
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    const context = ActorRdfReasonMediated.getContext(action.context);
    const result = await this.reason({
      sources: this.quadSources(context),
      updates: action.updates,
      settings: action.settings,
      context
    });
    await this.runUpdates(result, context);
    return { implicitSource: ActorRdfReasonMediated.getImplicitSource(context) };
  }
}

export interface IActorRdfReasonMediatedArgs
  extends IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput> {
    mediatorRdfUpdateQuads: Mediator<Actor<IActionRdfUpdateQuads, IActorTest,
    IActorRdfUpdateQuadsOutput>, IActionRdfUpdateQuads, IActorTest, IActorRdfUpdateQuadsOutput>;
    mediatorRdfResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
    IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
  }