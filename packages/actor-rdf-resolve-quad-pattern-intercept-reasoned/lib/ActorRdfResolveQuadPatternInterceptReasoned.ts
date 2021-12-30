import { ActorRdfResolveQuadPatternIntercept, IActionRdfResolveQuadPatternIntercept, IActorRdfResolveQuadPatternInterceptOutput, IActorRdfResolveQuadPatternInterceptArgs } from '@comunica/bus-rdf-resolve-quad-pattern-intercept';

/**
 * A comunica Reasoned RDF Resolve Quad Pattern Intercept Actor.
 */
export class ActorRdfResolveQuadPatternInterceptReasoned extends ActorRdfResolveQuadPatternIntercept {
  public constructor(args: IActorRdfResolveQuadPatternInterceptArgs) {
    super(args);
  }

  async runIntercept(action: IActionRdfResolveQuadPatternIntercept): Promise<IActionRdfResolveQuadPatternIntercept> {
    return action;
  }
}
