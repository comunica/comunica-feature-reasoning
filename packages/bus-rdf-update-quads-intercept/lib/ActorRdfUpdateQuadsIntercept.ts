import type { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput, MediatorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { Actor } from '@comunica/core';

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
  public readonly mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;

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
  mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
}

export type IActionRdfUpdateQuadsIntercept = IActionRdfUpdateQuads;
export type IActorRdfUpdateQuadsInterceptOutput = IActorRdfUpdateQuadsOutput;
export type MediatorRdfUpdateQuadsIntercept = MediatorRdfUpdateQuads;
