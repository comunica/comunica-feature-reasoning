/* eslint-disable unicorn/filename-case */
import type { IActorRuleDereferenceHttpParseArgs } from './ActorRuleDereferenceHttpParseBase';
import {
  ActorRuleDereferenceHttpParseBase,
} from './ActorRuleDereferenceHttpParseBase';

/**
 * The browser variant of {@link ActorRuleDereferenceHttpParse}.
 */
export class ActorRuleDereferenceHttpParse extends ActorRuleDereferenceHttpParseBase {
  public constructor(args: IActorRuleDereferenceHttpParseArgs) {
    super(args);
  }

  protected getMaxAcceptHeaderLength(): number {
    return this.maxAcceptHeaderLengthBrowser;
  }
}
