import type { MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import type { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput, MediatorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads';
import type { IActorArgs, IActorTest } from '@comunica/core';
// Import { Map } from 'immutable';
import type { IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { wrap, type AsyncIterator } from 'asynciterator';
import type { Algebra } from 'sparqlalgebrajs';
import type { IActionRdfReason, IActorRdfReasonOutput } from './ActorRdfReason';
import { ActorRdfReason, setImplicitDestination, setImplicitSource, setUnionSource } from './ActorRdfReason';

export abstract class ActorRdfReasonMediated extends ActorRdfReason implements IActorRdfReasonMediatedArgs {
  public readonly mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;

  public readonly mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;

  public constructor(args: IActorRdfReasonMediatedArgs) {
    super(args);
  }

  protected async runExplicitUpdate(changes: IActionRdfUpdateQuads): Promise<IActorRdfUpdateQuadsOutput> {
    return this.mediatorRdfUpdateQuads.mediate(changes);
  }

  protected async runImplicitUpdate(action: IActionRdfUpdateQuads): Promise<IActorRdfUpdateQuadsOutput> {
    return this.runExplicitUpdate({ ...action, context: setImplicitDestination(action.context) });
  }

  protected explicitQuadSource(context: IActionContext) {
    const match = (pattern: Algebra.Pattern): AsyncIterator<RDF.Quad> => wrap(this.mediatorRdfResolveQuadPattern.mediate({ context, pattern }).then(({ data }) => data));
    return { match };
  }

  protected implicitQuadSource(context: IActionContext) {
    return this.explicitQuadSource(setImplicitSource(context));
  }

  protected unionQuadSource(context: IActionContext) {
    return this.explicitQuadSource(setUnionSource(context));
  }
}

export interface IActorRdfReasonMediatedArgs
  extends IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput> {
  mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
  mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;
}
