import type { IActionRdfUpdateQuads, IActorRdfUpdateQuadsArgs, IActorRdfUpdateQuadsOutput, MediatorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads';
import { ActorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads';
import { IActorTest } from '@comunica/core';

// TODO: Remove this module my using something like 'reasoning groups'

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
export abstract class ActorRdfUpdateQuadsIntercept extends ActorRdfUpdateQuads {
  public readonly mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;

  public constructor(args: IActorRdfUpdateQuadsInterceptArgs) {
    super(args);
  }

  abstract runIntercept(action: IActionRdfUpdateQuadsIntercept): Promise<IActionRdfUpdateQuadsIntercept>;

  public async test(action: IActionRdfUpdateQuads): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionRdfUpdateQuadsIntercept): Promise<IActorRdfUpdateQuadsInterceptOutput> {
    return this.mediatorRdfUpdateQuads.mediate(await this.runIntercept(action));
  }
}

export interface IActorRdfUpdateQuadsInterceptArgs extends IActorRdfUpdateQuadsArgs {
  mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
}

export type IActionRdfUpdateQuadsIntercept = IActionRdfUpdateQuads;
export type IActorRdfUpdateQuadsInterceptOutput = IActorRdfUpdateQuadsOutput;
export type MediatorRdfUpdateQuadsIntercept = MediatorRdfUpdateQuads;
