import { Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';

/**
 * A comunica actor for rdf-filter-existing-quads events.
 *
 * Actor types:
 * * Input:  IActionRdfFilterExistingQuads:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorRdfFilterExistingQuadsOutput: TODO: fill in.
 *
 * @see IActionRdfFilterExistingQuads
 * @see IActorRdfFilterExistingQuadsOutput
 */
export abstract class ActorRdfFilterExistingQuads extends Actor<IActionRdfFilterExistingQuads, IActorTest, IActorRdfFilterExistingQuadsOutput> {
  public constructor(args: IActorArgs<IActionRdfFilterExistingQuads, IActorTest, IActorRdfFilterExistingQuadsOutput>) {
    super(args);
  }
}

export interface IActionRdfFilterExistingQuads extends IAction {

}

export interface IActorRdfFilterExistingQuadsOutput extends IActorOutput {

}

export type IActorRdfFilterExistingQuadsArgs = IActorArgs<
  IActionRdfFilterExistingQuads, IActorTest, IActorRdfFilterExistingQuadsOutput>;

export type MediatorRdfFilterExistingQuads = Mediate<
  IActionRdfFilterExistingQuads, IActorRdfFilterExistingQuadsOutput>;
