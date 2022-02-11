import { Readable } from 'stream';
import type { MediatorRdfParseHandle } from '@comunica/bus-rdf-parse';
import type { IActionRuleParse, IActorRuleParseOutput, IActorRuleParseFixedMediaTypesArgs } from '@comunica/bus-rule-parse';
import { ActorRuleParseFixedMediaTypes, Rule } from '@comunica/bus-rule-parse';
import type { Mediator, Actor, ActionContext } from '@comunica/core';
import { quad } from '@rdfjs/data-model';
import type * as RDF from '@rdfjs/types';
import { wrap } from 'asynciterator';
import type { Quad, Quad_Object } from 'n3';
import { NamedNode, Store } from 'n3';
import arrayifyStream = require('stream-to-array');

// Test suite https://github.com/w3c/N3/blob/16d1eec49048f87a97054540f4e1301e73a12130/tests/N3Tests/cwm_syntax/this-quantifiers-ref2.n3

/**
 * A comunica N3 Rule Parse Actor.
 */
export class ActorRuleParseN3 extends ActorRuleParseFixedMediaTypes {
  public readonly mediatorRdfParseHandle: MediatorRdfParseHandle;

  public constructor(args: IActorParseN3Args) {
    super(args);
  }

  public async runHandle(action: IActionRuleParse, mediaType: string, context: ActionContext):
  Promise<IActorRuleParseOutput> {
    const { handle } = await this.mediatorRdfParseHandle.mediate({
      handle: action,
      context,
      handleMediaType: mediaType,
    });
    const store = new Store();

    await new Promise((resolve, reject) => {
      store.import(handle.quads)
        .on('end', resolve)
        .on('error', reject);
    });

    const matches = wrap<Quad>(store.match(null, new NamedNode('http://www.w3.org/2000/10/swap/log#implies'), null));

    const rules = matches.transform<Rule>({
      async transform(qd, done, push) {
        if (qd.subject.termType === 'BlankNode' && qd.object.termType === 'BlankNode') {
          push(new Rule(await match(store, qd.subject), await match(store, qd.object)));
        }
        done();
      },
    });

    // @ts-expect-error
    return { rules: new Readable(rules) };
  }

  // Public async test(action: IActionRuleParse): Promise<IActorTest> {
  //   // TODO: Double check
  //   await this.mediatorRdfParse.mediateActor(action);
  //   return true;
  // }

  // public async run(action: IActionRuleParse): Promise<IActorRuleParseOutput> {
  // const { quads } = await this.mediatorRdfParse.mediate(action);
  // const store = new Store();

  // await new Promise((resolve, reject) => {
  //   store.import(quads)
  //     .on('end', resolve)
  //     .on('error', reject);
  // });

  // const matches = wrap<Quad>(store.match(null, new NamedNode('http://www.w3.org/2000/10/swap/log#implies'), null))

  // const rules = matches.transform<Rule>({
  //   transform: async (qd, done, push) => {
  //     if (qd.subject.termType === 'BlankNode' && qd.object.termType === 'BlankNode') {
  //       push(new Rule(await match(store, qd.subject), await match(store, qd.object)));
  //     }
  //     done();
  //   }
  // });
  // // @ts-ignore
  // return { rules };
  // }
}

// Function that converts a stream to an array
export function streamToArray(stream: RDF.Stream<RDF.Quad>): Promise<RDF.Quad[]> {
  return new Promise((resolve, reject) => {
    const quads: Quad[] = [];
    stream.on('data', quad => quads.push(quad));
    stream.on('end', () => resolve(quads));
    stream.on('error', reject);
  });
}

function match(store: Store, object: Quad_Object): Promise<RDF.Quad[]> {
  return streamToArray(
    wrap<Quad>(store.match(null, null, null, object)).map(
      // TODO: add graph as variable
      q => quad(q.subject, q.predicate, q.object),
    ),
  );
}

export interface IActorParseN3Args extends IActorRuleParseFixedMediaTypesArgs {
  mediatorRdfParse: MediatorRdfParse;
}
