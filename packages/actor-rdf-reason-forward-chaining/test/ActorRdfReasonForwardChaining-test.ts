import { ActionContext, Bus } from '@comunica/core';
import { IActionContext } from '@comunica/types';
import { Store } from 'n3';
import { ActorRdfReasonForwardChaining } from '../lib/ActorRdfReasonForwardChaining';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { IActionRdfUpdateQuadsInfo, MediatorRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoOutput } from '@comunica/bus-rdf-update-quads-info';
import { IActionRuleEvaluate, IActorRuleEvaluateOutput, MediatorRuleEvaluate } from '@comunica/bus-rule-evaluate';
import { getContextSource } from '@comunica/bus-rdf-resolve-quad-pattern';

describe('ActorRdfReasonForwardChaining', () => {
  let bus: any;
  let store: Store;
  let implicitDestination: Store;
  let context: IActionContext;
  let mediatorRuleEvaluate: MediatorRuleEvaluate;
  let mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfReasonForwardChaining instance', () => {
    let actor: ActorRdfReasonForwardChaining;

    beforeEach(() => {

      // @ts-ignore
      mediatorRuleEvaluate = {
        mediate(action: IActionRuleEvaluate): Promise<IActorRuleEvaluateOutput> {
          // TODO: Implement this
        }
      }

      // @ts-ignore
      mediatorRdfUpdateQuadsInfo = {
        async mediate(action: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
          return {
            execute: async() => {
              const dest: Store = action.context.getSafe(KeysRdfUpdateQuads.destination);

              // TODO: Remove type casting once https://github.com/rdfjs/N3.js/issues/286 is merged
              let quadStreamInsert = action.quadStreamInsert?.filter(quad => dest.addQuad(quad) as unknown as boolean);
    
              if (action.filterSource) {
                const source: Store = getContextSource(action.context) as Store;
                quadStreamInsert = quadStreamInsert?.filter(quad => !source.has(quad));
              }

              return { quadStreamInsert };
            }
          }
        }
      }

      actor = new ActorRdfReasonForwardChaining({
        name: 'actor',
        bus
        // TODO: Remove this once we do not require unecessary mediators
      } as any);
      store = new Store();
      implicitDestination = new Store();
      context = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: store,
        // TODO: Fix this, the context entry is wrong
        [KeysRdfReason.data.name]: implicitDestination,
      })
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
