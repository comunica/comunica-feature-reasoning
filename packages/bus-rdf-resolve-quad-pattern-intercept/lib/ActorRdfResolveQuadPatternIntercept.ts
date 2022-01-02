import type { IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput } from '@comunica/bus-rdf-resolve-quad-pattern';
import type { IAction, IActorArgs, IActorOutput, IActorTest, Mediator } from '@comunica/core';
import { Actor } from '@comunica/core';

/**
 * A comunica actor for rdf-resolve-quad-pattern-intercept events.
 *
 * Actor types:
 * * Input:  IActionRdfResolveQuadPatternIntercept:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorRdfResolveQuadPatternInterceptOutput: TODO: fill in.
 *
 * @see IActionRdfResolveQuadPatternIntercept
 * @see IActorRdfResolveQuadPatternInterceptOutput
 */
export abstract class ActorRdfResolveQuadPatternIntercept extends Actor<IActionRdfResolveQuadPatternIntercept, IActorTest, IActorRdfResolveQuadPatternInterceptOutput> {
  public readonly mediatorRdfResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;

  public constructor(args: IActorRdfResolveQuadPatternInterceptArgs) {
    super(args);
  }

  public async test(action: IActionRdfResolveQuadPatternIntercept): Promise<IActorTest> {
    return true;
  }

  abstract runIntercept(action: IActionRdfResolveQuadPatternIntercept): Promise<IActionRdfResolveQuadPatternIntercept>;

  public async run(action: IActionRdfResolveQuadPatternIntercept): Promise<IActorRdfResolveQuadPatternInterceptOutput> {
    return this.mediatorRdfResolveQuadPattern.mediate(await this.runIntercept(action));
  }
}

export interface IActorRdfResolveQuadPatternInterceptArgs extends IActorArgs<IActionRdfResolveQuadPatternIntercept, IActorTest, IActorRdfResolveQuadPatternInterceptOutput> {
  mediatorRdfResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
}

export interface IActionRdfResolveQuadPatternIntercept extends IAction, IActionRdfResolveQuadPattern {

}

export interface IActorRdfResolveQuadPatternInterceptOutput extends IActorOutput, IActorRdfResolveQuadPatternOutput {

}
