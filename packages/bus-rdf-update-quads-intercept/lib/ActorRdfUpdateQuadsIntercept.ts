import { Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediator } from '@comunica/core';
import type { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput } from '@comunica/bus-rdf-update-quads';

/**
 * A comunica actor for rdf-update-quads-intercept events.
 *
 * Actor types:
 * * Input:  IActionRdfUpdateQuadsIntercept:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorRdfUpdateQuadsInterceptOutput: TODO: fill in.
 *
 * @see IActionRdfUpdateQuadsIntercept
 * @see IActorRdfUpdateQuadsInterceptOutput
 */
export abstract class ActorRdfUpdateQuadsIntercept extends Actor<IActionRdfUpdateQuadsIntercept, IActorTest, IActorRdfUpdateQuadsInterceptOutput> {
  public readonly mediatorRdfUpdateQuads: Mediator<Actor<IActionRdfUpdateQuads, IActorTest,
  IActorRdfUpdateQuadsOutput>, IActionRdfUpdateQuads, IActorTest, IActorRdfUpdateQuadsOutput>;
  
  public constructor(args: IActorRdfUpdateQuadsInterceptArgs) {
    super(args);
  }

  public async test(action: IActionRdfUpdateQuadsIntercept): Promise<IActorTest> {
    return true;
  }

  abstract runIntercept(action: IActionRdfUpdateQuadsIntercept): Promise<IActionRdfUpdateQuadsIntercept>;

  public async run(action: IActionRdfUpdateQuadsIntercept): Promise<IActorRdfUpdateQuadsInterceptOutput> {
    return this.mediatorRdfUpdateQuads.mediate(await this.runIntercept(action));
  }
}

export interface IActorRdfUpdateQuadsInterceptArgs extends IActorArgs<IActionRdfUpdateQuadsIntercept, IActorTest, IActorRdfUpdateQuadsOutput> {
  mediatorRdfUpdateQuads: Mediator<Actor<IActionRdfUpdateQuads, IActorTest,
  IActorRdfUpdateQuadsOutput>, IActionRdfUpdateQuads, IActorTest, IActorRdfUpdateQuadsOutput>;
}

export interface IActionRdfUpdateQuadsIntercept extends IAction, IActionRdfUpdateQuads {

}

export interface IActorRdfUpdateQuadsInterceptOutput extends IActorOutput, IActorRdfUpdateQuadsOutput {

}
