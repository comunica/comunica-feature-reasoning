import { ActorRdfResolveQuadPatternRdfJsSource } from '@comunica/actor-rdf-resolve-quad-pattern-rdfjs-source';
import { ActorRdfResolveQuadPatternFederated } from '@comunica/actor-rdf-resolve-quad-pattern-federated';
import { Bus } from '@comunica/core';
import { createMediator } from './util';
import { Store } from 'n3';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { UnionIterator } from 'asynciterator';
import * as RDF from '@rdfjs/types';
// const federatedActor = new ActorRdfResolveQuadPatternFederated({
//   name: 'federated',
//   bus: new Bus({ name: 'bus' }),
//   mediatorResolveQuadPattern: createMediator(ActorRdfResolveQuadPatternRdfJsSource)
//  });

class MyActor extends ActorRdfResolveQuadPatternRdfJsSource {
  public constructor(args: any) {
    super(args);
  }

  public async run(action: any): Promise<any> {
    const sources: Store[] = action.context.get(KeysRdfResolveQuadPattern.source) ?
      [action.context.get(KeysRdfResolveQuadPattern.source)!] :
      action.context.get(KeysRdfResolveQuadPattern.sources) ?? [];

    const its = sources.map(source => super.run({ ...action, context: action.context.set(KeysRdfResolveQuadPattern.source, source) }));

    return {
      data: new UnionIterator<RDF.Quad>((await Promise.all(its)).map(it => it.data), { autoStart: false }),
    };
  }
}

export const mediatorRdfResolveQuadPattern = createMediator(MyActor);
