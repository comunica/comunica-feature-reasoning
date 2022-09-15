import { ActorRdfReason, IActionRdfReason, IActorRdfReasonOutput, IActorRdfReasonArgs } from '@comunica/bus-rdf-reason';
import { IActorArgs, IActorTest } from '@comunica/core';
import { IActionContext } from '@comunica/types';
import { Algebra, Factory } from 'sparqlalgebrajs';
import { MediatorRdfResolveQuadPattern, getContextSources, getContextSource, hasContextSingleSource, getDataSourceValue } from '@comunica/bus-rdf-resolve-quad-pattern';
import { MediatorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads';
import { getEyeIterator, getEyeIteratorUnwrapped } from './eyeiterator';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import * as RDF from '@rdfjs/types';
import { Variable, Store, StreamParser, Parser, NamedNode, Quad } from 'n3';
import { AsyncIterator, fromArray } from 'asynciterator';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
// import {} from '@com'

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
  private mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;

  public constructor(args: IActorRdfReasonArgs) {
    super(args);
  }

  public async contextToEyeIterator(context: IActionContext, query: string) {
    const contexts = contextToContexts(context);

    const iterators: { [key: string]: AsyncIterator<RDF.Quad> } = {};
    for (const key in contexts) {
      if (typeof key === 'string')
        iterators[key] = (await this.mediatorRdfResolveQuadPattern.mediate({ 
          context: contexts[key],
          pattern: factory.createPattern(
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
    // TODO: Map this to a quad stream
    const iterator = await this.contextToEyeIterator(action.context, query);

    // TODO: Do this with streams
    const parser = new Parser();
    const quadArray = parser.parse((await iterator.toArray()).join(''));
    const store = new Store(quadArray);
    const r = `http://www.w3.org/2000/10/swap/reason#`;
    const Proof = new NamedNode(`${r}Proof`)
    const gives = new NamedNode(`${r}gives`)
    const a = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
    
    const proofs = [...store.match(null, a, Proof)]
    if (proofs.length !== 1) {
      throw new Error('exactly one proof expected');
    }
    const [proof] = proofs;

    // TODO: Fix N3 typings here
    const graphOfResultsarr = [...store.match(proof as any, gives, null)];
    if (graphOfResultsarr.length !== 1) {
      throw new Error('Expected graph of results to have length exactly 1');
    }

    const [graphOfResults] = graphOfResultsarr;
    const results = [...store.match(null, null, null, graphOfResults as any)]
      .map(quad => {
        // Strip the graph from the proof.
        return new Quad(
          quad.subject as any,
          quad.predicate as any,
          quad.object as any
        )
      });

    //
    // Now do the main insertion (and this is where we need the correct super class to handle blocking for us)
    //
    //
    




    //
    // Now do the proof insertion
    //
    //
    const quadStreamInsert = fromArray(quadArray);

    // const store = new StreamParser();
    // store.pipe(iterator)
    // store.parse
    // store.

    const proofContext = action.context.set(
      KeysRdfUpdateQuads.destination,
      action.context.get(KeysRdfReason.proofDestination)
    );
    
    // Adding the proof to the destination
    this.mediatorRdfUpdateQuads.mediate({ quadStreamInsert, context: proofContext })


    // TODO: Use the store to add to the reasoning destination.
    // This is where we might need to use the reasoning class that we have already built.

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
