import { IActionRdfReason, IActorRdfReasonOutput } from '@comunica/bus-rdf-reason';
import { ActorRdfResolveQuadPattern, IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput, IQuadSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries'
import type { ActionContext, Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
import * as RDF from '@rdfjs/types'
import { quad } from '@rdfjs/data-model'

/**
 * A comunica Reasoned RDF Resolve Quad Pattern Actor.
 */
export class ActorRdfResolveQuadPatternReasoned extends ActorRdfResolveQuadPattern {
  public readonly mediatorResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
  public readonly mediatorRdfReason: Mediator<Actor<IActionRdfReason, IActorTest,
  IActorRdfReasonOutput>, IActionRdfReason, IActorTest, IActorRdfReasonOutput>;
  
  public constructor(args: IActorArgs<IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>) {
    super(args);
  }

  public async test(action: IActionRdfResolveQuadPattern): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfResolveQuadPattern): Promise<IActorRdfResolveQuadPatternOutput> {
    // action.pattern

    // TODO [FUTURE]: Separate sources to be reasoned over here
    const match = (subject: RDF.Term, predicate: RDF.Term, object: RDF.Term, graph: RDF.Term) => {
      this.mediatorResolveQuadPattern.mediate({
        context: action.context,
        pattern: quad(subject, predicate, object, graph),
      })
    }

    this.mediatorRdfReason.mediate({
      context: action.context,
      
    })

    // this.mediatorResolveQuadPattern.mediate({
    //   context: action.context,
    //   pattern
    // })

    // IDataSour

    // action.context.get(KeysRdfResolveQuadPattern.sources)
    
    return true; // TODO implement
  }
}
