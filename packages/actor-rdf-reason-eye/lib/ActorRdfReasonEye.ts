import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput, IActorRdfReasonArgs } from '@comunica/bus-rdf-reason';
import { IActorArgs, IActorTest } from '@comunica/core';
import { Algebra } from 'sparqlalgebrajs';

/**
 * A comunica Eye RDF Reason Actor.
 */
export class ActorRdfReasonEye extends ActorRdfReason {
  public constructor(args: IActorRdfReasonArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    const query = action.pattern ? patternToQuery(action.pattern) : `{ ?s ?p ?o } => { ?s ?p ?o }`;

    return true; // TODO implement
  }
}

// Note to self:
// - The dialogical reasoning part is where we *might* be able to get eye to start asking for triples
// - TODO: ASK Jos about this on Friday.

// TODO: Ask about named graphs here
function patternToQuery(pattern: Algebra.Pattern) {
  const patternString = `${pattern.subject} ${pattern.predicate} ${pattern.object}`;
  return `{${patternString}} => {${patternString}}`
}
