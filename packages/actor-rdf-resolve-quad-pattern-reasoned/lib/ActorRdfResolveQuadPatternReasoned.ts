import { ActorRdfResolveQuadPattern, IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput } from '@comunica/bus-rdf-resolve-quad-pattern';
import { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica Reasoned RDF Resolve Quad Pattern Actor.
 */
export class ActorRdfResolveQuadPatternReasoned extends ActorRdfResolveQuadPattern {
  public constructor(args: IActorArgs<IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>) {
    super(args);
  }

  public async test(action: IActionRdfResolveQuadPattern): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfResolveQuadPattern): Promise<IActorRdfResolveQuadPatternOutput> {
    return true; // TODO implement
  }
}
