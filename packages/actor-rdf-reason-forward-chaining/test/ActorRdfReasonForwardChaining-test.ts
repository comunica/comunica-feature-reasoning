import { ActionContext, Bus } from '@comunica/core';
import { IActionContext } from '@comunica/types';
import { Store } from 'n3';
import { ActorRdfReasonForwardChaining } from '../lib/ActorRdfReasonForwardChaining';
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';

describe('ActorRdfReasonForwardChaining', () => {
  let bus: any;
  let store: Store;
  let implicitDestination: Store;
  let context: IActionContext;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfReasonForwardChaining instance', () => {
    let actor: ActorRdfReasonForwardChaining;

    beforeEach(() => {
      actor = new ActorRdfReasonForwardChaining({
        name: 'actor',
        bus
      });
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
