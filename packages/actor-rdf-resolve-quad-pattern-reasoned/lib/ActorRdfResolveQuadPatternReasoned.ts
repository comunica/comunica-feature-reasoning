import { IActionRdfReason, IActorRdfReasonOutput, KeysRdfReason } from '@comunica/bus-rdf-reason';
import { ActorRdfResolveQuadPattern, IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput, IDataSource, IQuadSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries'
import type { Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
import { ActionContext } from '@comunica/core';
import * as RDF from '@rdfjs/types'
import { quad } from '@rdfjs/data-model'
import { wrap } from 'asynciterator'
import { ActorRdfReason } from '@comunica/bus-rdf-reason'

// function get 

interface IActorRdfResolveQuadPatternReasonedArgs extends IActorArgs<IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput> {
  mediatorRdfResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
    IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
  mediatorRdfReason: Mediator<Actor<IActionRdfReason, IActorTest,
    IActorRdfReasonOutput>, IActionRdfReason, IActorTest, IActorRdfReasonOutput>;
}


/**
 * A comunica Reasoned RDF Resolve Quad Pattern Actor.
 */
export class ActorRdfResolveQuadPatternReasoned extends ActorRdfResolveQuadPattern {
  public readonly mediatorRdfResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
    IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
  public readonly mediatorRdfReason: Mediator<Actor<IActionRdfReason, IActorTest,
    IActorRdfReasonOutput>, IActionRdfReason, IActorTest, IActorRdfReasonOutput>;

  public constructor(args: IActorRdfResolveQuadPatternReasonedArgs) {
    super(args);
  }

  public async test(action: IActionRdfResolveQuadPattern): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfResolveQuadPattern): Promise<IActorRdfResolveQuadPatternOutput> {
    const context = ActorRdfReason.getContext(action.context);

    await this.mediatorRdfReason.mediate({
      context,
      updates: {},
      settings: {
        // TODO [FUTURE]: All of these values should come from the context rather than being hardcoded
        lazy: false,
        sourceReasoned: false,
        patterns: [action.pattern],
        rules: context.get(KeysRdfReason.rules),
      },
    })

    return this.mediatorRdfResolveQuadPattern.mediate({
      context: ActorRdfReason.setUnionSource(context),
      pattern: action.pattern,
    })

    // const { context } = action;

    // // TODO [FUTURE]: Separate sources to be reasoned over here
    // // (or possibly pass sources directly to reasoner rather than doing this here, though that will require config changes)
    // const match = (...terms: Parameters<IQuadSource['match']>) => {
    //   return wrap<RDF.Quad>(this.mediatorResolveQuadPattern.mediate({
    //     context: context,
    //     pattern: quad(...terms),
    //   }).then(x => x.data));
    // }

    // const sources = this.hasContextSingleSource(context) ? [ <IDataSource> this.getContextSource(context) ] : this.getContextSources(context) ?? [];

    // this.mediatorRdfReason.publish



    // this.mediatorRdfReason.mediate({
    //   context: newContext.set(KeysRD),
    //   updates: {},
    //   settings: {
    //     // TODO [FUTURE]: All of these values should come from the context rather than being hardcoded
    //     lazy: false,
    //     sourceReasoned: false,
    //     patterns: [ action.pattern ],
    //     // This *definitely* needs to be fixed
    //     rules: [],
    //   },
    // })

    // const newContext = (context ?? ActionContext({}));

    // .remove(KeysRdfResolveQuadPattern.source).set(KeysRdfResolveQuadPattern.sources, [...sources);

    // return this.mediatorResolveQuadPattern.mediate({
    //   // TODO: Override context
    //   context: newContext,
    //   pattern: action.pattern,
    // })

    // IDataSour

    // action.context.get(KeysRdfResolveQuadPattern.sources)

    // return true; // TODO implement
  }
}
