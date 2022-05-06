import { Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';
import * as RDF from '@rdfjs/types';
import { AsyncIterator } from 'asynciterator';

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
  filterSource: boolean;
  filterDestination: boolean;
  quadStream: AsyncIterator<RDF.Quad>;
}

export interface IActorRdfFilterExistingQuadsOutput extends IActorOutput {
  /**
   * Executes to produce the filtered quad stream
   */
  execute(): Promise<{ quadStream: AsyncIterator<RDF.Quad> }>
}

export type IActorRdfFilterExistingQuadsArgs = IActorArgs<
  IActionRdfFilterExistingQuads, IActorTest, IActorRdfFilterExistingQuadsOutput>;

export type MediatorRdfFilterExistingQuads = Mediate<
  IActionRdfFilterExistingQuads, IActorRdfFilterExistingQuadsOutput>;
