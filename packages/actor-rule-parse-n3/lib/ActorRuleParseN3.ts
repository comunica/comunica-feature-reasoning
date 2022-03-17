import type { MediatorRdfParseHandle } from '@comunica/bus-rdf-parse';
import { MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import type { IActionRuleParse, IActorRuleParseOutput, IActorRuleParseFixedMediaTypesArgs } from '@comunica/bus-rule-parse';
import { ActorRuleParseFixedMediaTypes } from '@comunica/bus-rule-parse';
import type { ActionContext, IActorTest } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import type { IActionContext } from '@comunica/types';
import { quad } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import { wrap } from 'asynciterator';
import { promisifyEventEmitter } from 'event-emitter-promisify';
import type { Quad, Quad_Object } from 'n3';
import { Store, DataFactory } from 'n3';

// Test suite https://github.com/w3c/N3/blob/16d1eec49048f87a97054540f4e1301e73a12130/tests/N3Tests/cwm_syntax/this-quantifiers-ref2.n3

/**
 * A comunica N3 Rule Parse Actor.
 */
export class ActorRuleParseN3 extends ActorRuleParseFixedMediaTypes {
  // Whilst we do not currently use is mediator inside this component - we are leaving it here to prevent version
  // inflation when we require it in the future.
  // The plan is to replace lines 43-53 with mediatorRdfResolveQuadPattern.mediate and hence we are able to resolve
  // more types of sources
  public readonly mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;
  public readonly mediatorRdfParse: MediatorRdfParseHandle;

  public constructor(args: IActorParseN3Args) {
    super(args);
  }

  public async testHandle(action: IActionRuleParse, mediaType: string, context: IActionContext): Promise<IActorTest> {
    return this.mediatorRdfParse.publish({
      handle: action,
      context,
      handleMediaType: mediaType,
    });
  }

  public async runHandle(action: IActionRuleParse, mediaType: string, context: ActionContext):
  Promise<IActorRuleParseOutput> {
    const { handle } = await this.mediatorRdfParse.mediate({
      handle: action,
      context,
      handleMediaType: mediaType,
    });

    const store = new Store();
    await promisifyEventEmitter(store.import(handle.data));

    const matches = wrap<Quad>(store.match(null, DataFactory.namedNode('http://www.w3.org/2000/10/swap/log#implies'), null));

    const rules = matches.transform<Rule>({
      async transform({ subject, object }, done, push) {
        if (subject.termType === 'BlankNode' && object.termType === 'BlankNode') {
          push({ premise: await match(store, subject), conclusion: await match(store, object), ruleType: 'premise-conclusion' });
        }
        done();
      },
    });

    return { data: <any> rules };
  }
}

function match(store: Store, object: Quad_Object): Promise<RDF.Quad[]> {
  // TODO: add graph as variable
  return wrap<Quad>(store.match(null, null, null, object)).map(q => quad(q.subject, q.predicate, q.object)).toArray();
}

export interface IActorParseN3Args extends IActorRuleParseFixedMediaTypesArgs {
  mediatorRdfParse: MediatorRdfParseHandle;
}
