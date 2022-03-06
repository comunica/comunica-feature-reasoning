import type { MediatorRdfParseHandle } from '@comunica/bus-rdf-parse';
import type { IActionRuleParse, IActorRuleParseOutput, IActorRuleParseFixedMediaTypesArgs } from '@comunica/bus-rule-parse';
import { ActorRuleParseFixedMediaTypes } from '@comunica/bus-rule-parse';
import type { ActionContext, IActorTest } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import type { IActionContext } from '@comunica/types';
import { quad } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import arrayifyStream from 'arrayify-stream';
import { wrap } from 'asynciterator';
import { promisifyEventEmitter } from 'event-emitter-promisify';
import type { Quad, Quad_Object } from 'n3';
import { Store, DataFactory } from 'n3';

// Test suite https://github.com/w3c/N3/blob/16d1eec49048f87a97054540f4e1301e73a12130/tests/N3Tests/cwm_syntax/this-quantifiers-ref2.n3

/**
 * A comunica N3 Rule Parse Actor.
 */
export class ActorRuleParseN3 extends ActorRuleParseFixedMediaTypes {
  // MediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;
  public readonly mediatorRdfParseHandle: MediatorRdfParseHandle;

  public constructor(args: IActorParseN3Args) {
    super(args);
  }

  public async testHandle(action: IActionRuleParse, mediaType: string, context: IActionContext): Promise<IActorTest> {
    return this.mediatorRdfParseHandle.publish({
      handle: action,
      context,
      handleMediaType: mediaType,
    });
  }

  public async runHandle(action: IActionRuleParse, mediaType: string, context: ActionContext):
  Promise<IActorRuleParseOutput> {
    // This.mediatorRdfResolveQuadPattern.mediate;

    const { handle } = await this.mediatorRdfParseHandle.mediate({
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

    // @ts-expect-error
    return { data: rules };
  }
}

function match(store: Store, object: Quad_Object): Promise<RDF.Quad[]> {
  return arrayifyStream<RDF.Quad>(
    wrap<Quad>(store.match(null, null, null, object)).map(
      // TODO: add graph as variable
      q => quad(q.subject, q.predicate, q.object),
    ),
  );
}

export interface IActorParseN3Args extends IActorRuleParseFixedMediaTypesArgs {
  mediatorRdfParse: MediatorRdfParseHandle;
}
