import { ActorRuleParse, IActionRuleParse, IActorRuleParseOutput, Rule } from '@comunica/bus-rule-parse';
import { IActorArgs, IActorTest } from '@comunica/core';
import { quad } from '@rdfjs/data-model';
import * as RDF from '@rdfjs/types';
import { wrap } from 'asynciterator';
import { NamedNode, Quad, Store, StreamParser, Quad_Object } from 'n3';
import arrayifyStream = require('stream-to-array');

// Test suite https://github.com/w3c/N3/blob/16d1eec49048f87a97054540f4e1301e73a12130/tests/N3Tests/cwm_syntax/this-quantifiers-ref2.n3

/**
 * A comunica N3 Rule Parse Actor.
 */
export class ActorRuleParseN3 extends ActorRuleParse {
  public constructor(args: IActorArgs<IActionRuleParse, IActorTest, IActorRuleParseOutput>) {
    super(args);
  }

  public async test(action: IActionRuleParse): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRuleParse): Promise<IActorRuleParseOutput> {
    // TODO: Use a mediator so that any rdf source can be used here
    const parser = new StreamParser({ format: 'N3' });
    const store = new Store();

    await new Promise((resolve, reject) => {
      store.import(wrap<Quad>(parser.import(action.input)))
        // .on('data', quad => {})
        .on('end', resolve)
        .on('error', reject);
    });

    const matches = store.match(null, new NamedNode('http://www.w3.org/2000/10/swap/log#implies'), null)
    
    // console.log('The quads are:', store.getQuads(null, null, null, null));
    // console.log('the matches are', await streamToArray(matches));
    const rules = wrap<Quad>(matches).transform<Rule>({
      transform: async (qd, done, push) => {
        console.log('transforming', qd)
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
      q => quad(q.subject, q.predicate, q.object)
    )
  )
}
