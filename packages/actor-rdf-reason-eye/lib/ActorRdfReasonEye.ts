import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput, IActorRdfReasonArgs } from '@comunica/bus-rdf-reason';
import { IActorArgs, IActorTest } from '@comunica/core';
import { IActionContext } from '@comunica/types';
import { Algebra, Factory } from 'sparqlalgebrajs';
import { MediatorRdfResolveQuadPattern, getContextSources, getContextSource, hasContextSingleSource, getDataSourceValue } from '@comunica/bus-rdf-resolve-quad-pattern';
import { getEyeIterator, getEyeIteratorUnwrapped } from './eyeiterator';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import * as RDF from '@rdfjs/types';
import { Variable } from 'n3';
import { AsyncIterator } from 'asynciterator';

const factory = new Factory();

function contextToContexts(context: IActionContext) {
  const sources = getContextSources(context) ?? (hasContextSingleSource(context) ? [getContextSource(context)!] : []);
  const data: { [key: string]: IActionContext } = {};

  const clearContext = context
    .delete(KeysRdfResolveQuadPattern.source)
    .delete(KeysRdfResolveQuadPattern.sources);

  for (const source of sources) {
    data[`${getDataSourceValue(source)}`] = clearContext.set(KeysRdfResolveQuadPattern.source, source)
  }

  return data;
}

/**
 * A comunica Eye RDF Reason Actor.
 */
export class ActorRdfReasonEye extends ActorRdfReason {
  private mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;

  public constructor(args: IActorRdfReasonArgs) {
    super(args);
  }

  public async contextToEyeIterator(context: IActionContext, query: string) {
    const contexts = contextToContexts(context);

    const iterators: { [key: string]: AsyncIterator<RDF.Quad> } = {};
    for (const key in contexts) {
      if (typeof key === 'string')
        iterators[key] = (await this.mediatorRdfResolveQuadPattern.mediate({ context: contexts[key], pattern: factory.createPattern(
          new Variable('s'),
          new Variable('p'),
          new Variable('o'),
          new Variable('g')
        ) })).data
    }

    return getEyeIteratorUnwrapped(iterators, query);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    /* ?s a ex:Person ?g */

    // TODO: Use CLI args rather than being hacky with the query here
    const query = action.pattern ? patternToQuery(action.pattern) : `{ ?s ?p ?o } => { ?s ?p ?o }`;
    const iterator = await this.contextToEyeIterator(action.context, query);

    // const quads = await this.mediatorRdfResolveQuadPattern.mediate({ context: action.context, pattern: /* ?s a ?o ?g */ })

    // The steps here are:
    // 1. For each source - use resolve-quad-pattern to get all quads for each source,
    //    convert these quads into a string file format and then pass that into Eye
    // 2. Run Eye with that and the query
    // 3. Add any relevant results to the reasoning store
    // TODO: To me the open question is how to then include the proof in the SPARQL query result. Is this even necessary?

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
