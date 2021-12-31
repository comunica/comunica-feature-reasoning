import type { IActionRuleDereference, IActorRuleDereferenceOutput } from '@comunica/bus-rule-dereference';
import { ActorRuleDereference } from '@comunica/bus-rule-dereference';
import type { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica Fallback Rule Dereference Actor.
 */
export class ActorRuleDereferenceFallback extends ActorRuleDereference {
  public constructor(args: IActorArgs<IActionRuleDereference, IActorTest, IActorRuleDereferenceOutput>) {
    super(args);
  }

  public async test(action: IActionRuleDereference): Promise<IActorTest> {
    return true;
  }

  public async run(action: IActionRuleDereference): Promise<IActorRuleDereferenceOutput> {
    return this.handleDereferenceError(action, new Error(`Could not dereference '${action.url}'`));
  }
}
