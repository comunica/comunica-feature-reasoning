import { Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';

/**
 * A comunica actor for rdf-update-quads-info events.
 *
 * Actor types:
 * * Input:  IActionRdfUpdateQuadsInfo:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorRdfUpdateQuadsInfoOutput: TODO: fill in.
 *
 * @see IActionRdfUpdateQuadsInfo
 * @see IActorRdfUpdateQuadsInfoOutput
 */
export abstract class ActorRdfUpdateQuadsInfo extends Actor<IActionRdfUpdateQuadsInfo, IActorTest, IActorRdfUpdateQuadsInfoOutput> {
  public constructor(args: IActorArgs<IActionRdfUpdateQuadsInfo, IActorTest, IActorRdfUpdateQuadsInfoOutput>) {
    super(args);
  }
}

export interface IActionRdfUpdateQuadsInfo extends IAction {

}

export interface IActorRdfUpdateQuadsInfoOutput extends IActorOutput {

}

export type IActorRdfUpdateQuadsInfoArgs = IActorArgs<
  IActionRdfUpdateQuadsInfo, IActorTest, IActorRdfUpdateQuadsInfoOutput>;

export type MediatorRdfUpdateQuadsInfo = Mediate<
  IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoOutput>;
