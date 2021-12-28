import { ActorRuleDereferenceHttpParseBase } from './ActorRuleDereferenceHttpParseBase';

/**
 * The non-browser variant of {@link ActorRuleDereferenceHttpParse}.
 */
export class ActorRuleDereferenceHttpParse extends ActorRuleDereferenceHttpParseBase {
  protected getMaxAcceptHeaderLength(): number {
    return this.maxAcceptHeaderLength;
  }
}
