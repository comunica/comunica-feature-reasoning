import { ActorRdfResolveQuadPatternRdfJsSource } from '@comunica/actor-rdf-resolve-quad-pattern-rdfjs-source';
import { ActorRdfResolveQuadPatternFederated } from '@comunica/actor-rdf-resolve-quad-pattern-federated';
import { Bus } from '@comunica/core';
import { createMediator } from './util';

const federatedActor = new ActorRdfResolveQuadPatternFederated({
  name: 'federated',
  bus: new Bus({ name: 'bus' }),
  mediatorResolveQuadPattern: createMediator(ActorRdfResolveQuadPatternRdfJsSource)
 });

class MyActor extends ActorRdfResolveQuadPatternRdfJsSource {
  public constructor(args: any) {
    super(args);
  }

  public async test(action: any): Promise<any> {
    try {
      return super.test(action)
    } catch (e) {
      return federatedActor.test(action);
    }
  }

  public async run(action: any): Promise<any> {
    try {
      federatedActor.test(action);
      return federatedActor.run(action)
    } catch (e) {
      return super.run(action);
    }
  }
}

export const mediatorRdfResolveQuadPattern = createMediator(ActorRdfResolveQuadPatternRdfJsSource);
