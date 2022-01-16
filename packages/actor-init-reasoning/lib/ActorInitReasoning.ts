import { ActorInit, IActionInit, IActorInitOutput } from '@comunica/bus-init';
import { IActorArgs, IActorTest } from '@comunica/core';

/**
 * A comunica Reasoning Init Actor.
 */
export class ActorInitReasoning extends ActorInit {
  public constructor(args: IActorArgs<IActionInit, IActorTest, IActorInitOutput>) {
    super(args);
  }

  public async test(action: IActionInit): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionInit): Promise<IActorInitOutput> {
    return true; // TODO implement
  }
}
