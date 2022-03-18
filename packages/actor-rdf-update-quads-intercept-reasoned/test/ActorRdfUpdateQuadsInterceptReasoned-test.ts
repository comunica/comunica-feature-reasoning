import { ActorRdfResolveQuadPatternRdfJsSource } from '@comunica/actor-rdf-resolve-quad-pattern-rdfjs-source';
import { ActorRdfUpdateQuadsRdfJsStore } from '@comunica/actor-rdf-update-quads-rdfjs-store';
import { IActionRdfReason, IActorRdfReasonOutput, IReasonGroup, KeysRdfReason, MediatorRdfReason, setContextReasoning } from '@comunica/bus-rdf-reason';
import { MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import { MediatorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { ActionContext, Actor, Bus, IAction, IActorOutput, IActorReply, IActorTest, Mediate } from '@comunica/core';
import { Store } from 'n3';
import { ActorRdfUpdateQuadsInterceptReasoned } from '../lib/ActorRdfUpdateQuadsInterceptReasoned';
import { IActionContext } from '@comunica/types';

// Returns a promise that resolves after timeout milliseconds.
function timedPromise(timeout: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

// Creates a mediator from a single actor
function createMediator<I extends IAction, T extends IActorTest, O extends IActorOutput>(ActorClass: new (args: { name: string, bus: Bus<Actor<I, T, O>, I, T, O> }) => Actor<I, T, O>): Mediate<I, O, T> {
  const actor = new ActorClass({
    bus: new Bus({ name: 'bus' }),
    name: 'actor'
  });
  return {
    async mediate(action) {
      return actor.run(action);
    },
    async mediateActor(action) {
      await actor.test(action);
      return actor;
    },
    publish(action: I): IActorReply<Actor<I, T, O>, I, T, O>[] {
      return [{ actor, reply: actor.test(action) }];
    }
  } as Mediate<I, O, T>
}

describe('ActorRdfUpdateQuadsInterceptReasoned', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsInterceptReasoned instance', () => {
    let actor: ActorRdfUpdateQuadsInterceptReasoned;
    let mediatorRdfReason: MediatorRdfReason;
    let mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;
    let mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
    let source: Store;
    let destination: Store;
    let implicitDestination: Store;
    let reasonGroup: IReasonGroup;
    let context: IActionContext;

    beforeEach(() => {
      // @ts-ignore
      mediatorRdfReason = {
        async mediate(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
          return {
            execute: async () => {
              setContextReasoning(action.context, timedPromise(10));
            }
          };
        }
      };
      mediatorRdfResolveQuadPattern = createMediator(ActorRdfResolveQuadPatternRdfJsSource);
      mediatorRdfUpdateQuads = createMediator(ActorRdfUpdateQuadsRdfJsStore);
      source = new Store();
      destination = new Store();
      reasonGroup = {
        dataset: implicitDestination,
        status: { type: 'full', reasoned: false },
        context: new ActionContext(),
      };
      context = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: source,
        [KeysRdfUpdateQuads.destination.name]: destination,
        [KeysRdfReason.data.name]: reasonGroup,
      });
      // {
      //   async mediate(action: IActionRdfResolveQuadPattern): Promise<IActorRdfResolveQuadPatternOutput> {
      //     const actor = new ActorRdfResolveQuadPatternRdfJsSource({
      //       bus: new Bus({ name: 'bus' }),
      //       name: 'actor'
      //     })
      //     return actor.run(action);
      //     // const data = new ArrayIterator([
      //     //   quad('s1', 'p1', 'o1'),
      //     //   quad('s1', 'p1', 'o2'),
      //     // ], { autoStart: false });
      //     // data.setProperty('metadata', {
      //     //   cardinality: { type: 'estimate', value: 2 },
      //     //   canContainUndefs: false,
      //     // });
      //     // return { data };
      //   }
      // }

      actor = new ActorRdfUpdateQuadsInterceptReasoned({
        name: 'actor',
        bus,
        mediatorRdfReason,
        mediatorRdfResolveQuadPattern,
        mediatorRdfUpdateQuads
      });
    });

    it('should test true if source and destination are provided', () => {
      return expect(actor.test({ context })).resolves.toEqual(true);
    });

    it('should reject if a destination is not provided provided', () => {
      return expect(actor.test({
        context: new ActionContext({
          [KeysRdfResolveQuadPattern.source.name]: source,
        }),
      })).rejects.toThrowError();
    });

    it('should run', async () => {
      const { execute } = await actor.run({ context });
      await execute();
      expect(destination.getQuads(null, null, null, null)).toEqual([])
    });
  });
});
