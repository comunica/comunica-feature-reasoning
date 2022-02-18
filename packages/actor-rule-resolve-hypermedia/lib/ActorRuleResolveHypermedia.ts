import LRUCache = require('lru-cache');
import { ActorRuleResolve, ActorRuleResolveSource, IActionRuleResolve, IActorRuleResolveArgs, IRuleSource } from '@comunica/bus-rule-resolve';
import { MediatorDereferenceRule } from '@comunica/bus-dereference-rule';
import { IActorArgs, IActorTest } from '@comunica/core';
import { IActionContext } from '@comunica/types';
// TODO: Use reasoning types
import { Rule } from '@comunica/bus-rule-parse';
import { wrap, AsyncIterator, fromArray } from 'asynciterator';
import type { ActorHttpInvalidateListenable, IActionHttpInvalidate } from '@comunica/bus-http-invalidate';
import { getContextSource } from '@comunica/bus-rule-resolve/lib/util';

/**
 * A comunica Hypermedia Rule Resolve Actor.
 */
export class ActorRuleResolveHypermedia extends ActorRuleResolveSource
  implements IActorRuleResolveHypermediaArgs {
  public readonly mediatorDereferenceRule: MediatorDereferenceRule;
  public readonly httpInvalidator: ActorHttpInvalidateListenable;
  public readonly cacheSize: number;
  public readonly cache?: LRUCache<string, MediatedRuleSource>;

  public constructor(args: IActorRuleResolveHypermediaArgs) {
    super(args);
    this.cache = this.cacheSize ? new LRUCache<string, any>({ max: this.cacheSize }) : undefined;
    const cache = this.cache;
    if (cache) {
      this.httpInvalidator.addInvalidateListener(
        ({ url }: IActionHttpInvalidate) => url ? cache.del(url) : cache.reset(),
      );
    }
  }

  public async test(action: IActionRuleResolve): Promise<IActorTest> {
    // TODO: Add something like this back in when we have multiple sources
    // const sources = hasContextSingleSource(action.context);
    // if (!sources) {
    //   throw new Error(`Actor ${this.name} can only resolve quad pattern queries against a single source.`);
    // }
    return true;
  }

  protected async getSource(context: IActionContext): Promise<MediatedRuleSource> {
    const url = getContextSource(context);

    if (!url) {
      throw new Error('No url found in context source');
    }

    let source = this.cache?.get(url);

    if (!source) {
      // If not in cache, create a new source
      source = new MediatedRuleSource(context, url, this);
      // Set in cache
      this.cache?.set(url, source);
    }

    return source;
  }
}


class MediatedRuleSource implements IRuleSource {
  private cache: Rule[] | undefined;

  public constructor(
    public readonly context: IActionContext,
    public readonly url: string,
    public readonly mediators: IMediatorArgs
  ) {

  }

  get(): AsyncIterator<Rule> {
    if (this.cache) {
      return fromArray(this.cache)
    }

    const data = wrap<Rule>(this.mediators.mediatorDereferenceRule.mediate({
      url: this.url,
      context: this.context
    }).then(({ data }) => data))

    this.cache = [];
    return data.map(rule => { this.cache?.push(rule); return rule; })
  }
}

interface IActorRuleResolveHypermediaArgs extends IActorRuleResolveArgs, IMediatorArgs {
}

interface IMediatorArgs {
  mediatorDereferenceRule: MediatorDereferenceRule;
}
