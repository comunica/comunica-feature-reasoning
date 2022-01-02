import { FederatedQuadSource } from '@comunica/actor-rdf-resolve-quad-pattern-federated';
import type { IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput } from '@comunica/bus-rdf-resolve-quad-pattern';
import type { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput } from '@comunica/bus-rdf-update-quads';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type { Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
// Import { Map } from 'immutable';
import type { ActionContext } from '@comunica/types';
import { quad } from '@rdfjs/data-model';
import { wrap, type AsyncIterator } from 'asynciterator';
import type * as RDF from 'rdf-js';
import type { Algebra } from 'sparqlalgebrajs';
import type { IActionRdfReason, IActorRdfReasonOutput } from './ActorRdfReason';
import { ActorRdfReason, setImplicitDestination, setImplicitSource, setUnionSource } from './ActorRdfReason';

function deskolemizeQuad(term: RDF.Quad, sourceId: string) {
  return quad(
    // @ts-expect-error
    FederatedQuadSource.deskolemizeTerm(term.subject, sourceId),
    FederatedQuadSource.deskolemizeTerm(term.predicate, sourceId),
    FederatedQuadSource.deskolemizeTerm(term.object, sourceId),
    FederatedQuadSource.deskolemizeTerm(term.graph, sourceId),
  );
}

export abstract class ActorRdfReasonMediated extends ActorRdfReason implements IActorRdfReasonMediatedArgs {
  public readonly mediatorRdfUpdateQuads: Mediator<Actor<IActionRdfUpdateQuads, IActorTest,
  IActorRdfUpdateQuadsOutput>, IActionRdfUpdateQuads, IActorTest, IActorRdfUpdateQuadsOutput>;

  public readonly mediatorRdfResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;

  public constructor(args: IActorRdfReasonMediatedArgs) {
    super(args);
  }

  protected async runExplicitUpdate(changes: IActionRdfUpdateQuads, context: ActionContext) {
    const { updateResult } = await this.mediatorRdfUpdateQuads.mediate({
      // NOTE: THE DESKOLEMISATION HERE IS A TEMPORARY WORKAROUND AND NEEDS TO BE FIXED
      quadStreamInsert: changes.quadStreamInsert?.map(quad => deskolemizeQuad(quad, context.get(KeysRdfResolveQuadPattern.sources)?.length ?? 1)),
      quadStreamDelete: changes.quadStreamDelete?.map(quad => deskolemizeQuad(quad, context.get(KeysRdfResolveQuadPattern.sources)?.length ?? 1)),
      context,
    });
    return updateResult;
  }

  protected async runImplicitUpdate(changes: IActionRdfUpdateQuads, context: ActionContext) {
    return this.runExplicitUpdate(changes, setImplicitDestination(context));
  }

  protected explicitQuadSource(context: ActionContext) {
    const match = (pattern: Algebra.Pattern): AsyncIterator<RDF.Quad> => {
      const data = this.mediatorRdfResolveQuadPattern.mediate({ context, pattern })
        .then(({ data }) => data);
      return wrap(data);
    };
    return { match };
  }

  protected implicitQuadSource(context: ActionContext) {
    return this.explicitQuadSource(setImplicitSource(context));
  }

  protected unionQuadSource(context: ActionContext) {
    return this.explicitQuadSource(setUnionSource(context));
  }
}

export interface IActorRdfReasonMediatedArgs
  extends IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput> {
  mediatorRdfUpdateQuads: Mediator<Actor<IActionRdfUpdateQuads, IActorTest,
  IActorRdfUpdateQuadsOutput>, IActionRdfUpdateQuads, IActorTest, IActorRdfUpdateQuadsOutput>;
  mediatorRdfResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
}
