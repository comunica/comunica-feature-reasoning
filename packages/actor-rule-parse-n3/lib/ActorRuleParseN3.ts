import { ActorRuleParse, IActionRuleParse, IActorRuleParseOutput, Rule } from '@comunica/bus-rule-parse';
import { IActionRdfParse, IActorRdfParseOutput } from '@comunica/bus-rdf-parse'
import { IActorArgs, IActorTest, Mediator, Actor, IAction, IActorOutput } from '@comunica/core';
import { quad } from '@rdfjs/data-model';
import * as RDF from '@rdfjs/types';
import { wrap } from 'asynciterator';
import { NamedNode, Quad, Store, Quad_Object } from 'n3';
import arrayifyStream = require('stream-to-array');

// Test suite https://github.com/w3c/N3/blob/16d1eec49048f87a97054540f4e1301e73a12130/tests/N3Tests/cwm_syntax/this-quantifiers-ref2.n3

/**
 * A comunica N3 Rule Parse Actor.
 */
export class ActorRuleParseN3 extends ActorRuleParse {
  public readonly mediatorRdfParse: Mediator<Actor<IActionRdfParse, IActorTest, IActorRdfParseOutput>,
  IActionRdfParse, IActorTest, IActorRdfParseOutput>;

  public constructor(args: IActorParseN3Args) {
    super(args);
  }

  public async test(action: IActionRuleParse): Promise<IActorTest> {
    // TODO: Double check
    await this.mediatorRdfParse.mediateActor(action);
    return true;
  }

  public async run(action: IActionRuleParse): Promise<IActorRuleParseOutput> {
    const { quads } = await this.mediatorRdfParse.mediate(action);
    const store = new Store();

    await new Promise((resolve, reject) => {
      store.import(quads)
        .on('end', resolve)
        .on('error', reject);
    });

    const matches = wrap<Quad>(store.match(null, new NamedNode('http://www.w3.org/2000/10/swap/log#implies'), null))

    const rules = matches.transform<Rule>({
      transform: async (qd, done, push) => {
        if (qd.subject.termType === 'BlankNode' && qd.object.termType === 'BlankNode') {
          push(new Rule(await match(store, qd.subject), await match(store, qd.object)));
        }
        done();
      }
    });
    // @ts-ignore
    return { rules };
  }
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
      q => quad(q.subject, q.predicate, q.object)
    )
  )
}

export interface IActorParseN3Args extends IActorArgs<IActionRuleParse, IActorTest, IActorRuleParseOutput> {
  mediatorRdfParse: Mediator<Actor<IActionRdfParse, IActorTest, IActorRdfParseOutput>,
  IActionRdfParse, IActorTest, IActorRdfParseOutput>;
}
