import { ActorRdfResolveQuadPatternRdfJsSource } from '@comunica/actor-rdf-resolve-quad-pattern-rdfjs-source';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import type * as RDF from '@rdfjs/types';
import { UnionIterator } from '../../actor-rdf-reason-forward-chaining/lib/asynciterator';
import { wrap, fromIterable } from '../../actor-rdf-reason-forward-chaining/lib/util';
import type { Store } from 'n3';
import { createMediator } from './util';
import { RdfJsQuadSource } from '@comunica/actor-rdf-resolve-quad-pattern-rdfjs-source';
// Const federatedActor = new ActorRdfResolveQuadPatternFederated({
//   name: 'federated',
//   bus: new Bus({ name: 'bus' }),
//   mediatorResolveQuadPattern: createMediator(ActorRdfResolveQuadPatternRdfJsSource)
//  });
import { IActionRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';

class MyActor extends ActorRdfResolveQuadPatternRdfJsSource {
  public constructor(args: any) {
    super(args);
  }

  public async run(action: IActionRdfResolveQuadPattern): Promise<any> {
    const sources: Store[] = action.context.get(KeysRdfResolveQuadPattern.source) ?
      [ action.context.get(KeysRdfResolveQuadPattern.source)! ] :
      action.context.get(KeysRdfResolveQuadPattern.sources) ?? [];

    const pattern = action.pattern;
    const s = RdfJsQuadSource.nullifyVariables(pattern.subject);
    const p = RdfJsQuadSource.nullifyVariables(pattern.predicate);
    const o = RdfJsQuadSource.nullifyVariables(pattern.object);
    const g = RdfJsQuadSource.nullifyVariables(pattern.graph);
    
    const its = sources.map(
      source => fromIterable(source.match(s as any, p as any, o as any, g as any)),
    );

    return {
      data: new UnionIterator<RDF.Quad>(its, { autoStart: false }),
    };
  }
}

export const mediatorRdfResolveQuadPattern = createMediator(MyActor);
