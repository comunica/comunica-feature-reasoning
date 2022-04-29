import { Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediate } from '@comunica/core';
import { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput } from '@comunica/bus-rdf-update-quads';
import { AsyncIterator } from 'asynciterator'
import * as RDF from '@rdfjs/types';

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
  public constructor(args: IActorRdfUpdateQuadsInfoArgs) {
    super(args);
  }
}

export interface IActionRdfUpdateQuadsInfo extends IAction, IActionRdfUpdateQuads {
  // /**
  //  * By default, the 'quadStreamUpdate' will be filtered with respect to the sources
  //  * so only new data within the scope is returned
  //  */
  // quadStreamUpdate: boolean;
  /**
   * Whether to filter out quads that were in any of the sources before the update.
   */
   filterSource: boolean;
}

export interface IActorRdfUpdateQuadsInfoOutput extends IActorOutput {
  /**
   * Async function that resolves when the update operation is done.
   */
  execute: () => Promise<{ quadStreamInsert?: AsyncIterator<RDF.Quad>, quadStreamDelete?: AsyncIterator<RDF.Quad> }>;
}

export type IActorRdfUpdateQuadsInfoArgs = IActorArgs<
  IActionRdfUpdateQuadsInfo, IActorTest, IActorRdfUpdateQuadsInfoOutput>;

export type MediatorRdfUpdateQuadsInfo = Mediate<
  IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoOutput>;
