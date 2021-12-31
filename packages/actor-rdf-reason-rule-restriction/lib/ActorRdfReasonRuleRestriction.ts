import { IActionRdfReason, IActorRdfReasonOutput, IActorRdfReasonMediatedArgs, getImplicitSource, KeysRdfReason } from '@comunica/bus-rdf-reason';
import { ActorRdfReasonMediated } from '@comunica/bus-rdf-reason';
import { IActorTest } from '@comunica/core';
import { Store } from 'n3'
import { evaluateRuleSet, RestrictableRule, Rule } from './reasoner';
import { single, fromArray, empty, AsyncIterator } from 'asynciterator';
// import { namedNode, quad } from '@rdfjs/data-model'
import { DataFactory } from 'n3';
// import { variable } from '@rdfjs/data-model';
import { Factory } from 'sparqlalgebrajs';
const factory = new Factory();
import arrayifyStream = require('arrayify-stream');
import * as RDF from '@rdfjs/types';
import { defaultGraph } from '@rdfjs/data-model';

const { quad, namedNode, variable } = DataFactory

// async function promisifyEventEmitter(eventEmitter: AsyncIterator): Promise<void> {
//   return new Promise<void>((resolve, reject) => {
//     eventEmitter.on('end', resolve);
//     eventEmitter.on('error', reject);
//   });
// }

async function promisifyEventEmitter(eventEmitter: AsyncIterator<RDF.Quad>): Promise<RDF.Quad[]> {
  const arr: RDF.Quad[] = []
  return new Promise<RDF.Quad[]>((resolve, reject) => {
    eventEmitter.on('end', () => {
      resolve(arr);
    });
    eventEmitter.on('data', (data: RDF.Quad) => {
      arr.push(data);
    });
    eventEmitter.on('error', reject);
  });
}

/**
 * A comunica actor that 
 */
export class ActorRdfReasonRuleRestriction extends ActorRdfReasonMediated {
  public constructor(args: IActorRdfReasonMediatedArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    if (!action.context?.has(KeysRdfReason.dataset) || !action.context?.has(KeysRdfReason.dataset)) {
      throw new Error('Missing dataset or rule context')
    }
    return true; // TODO implement
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    const { context } = action;

    if (!context) {
      throw new Error('Context required for reasoning')
    }

    const store = new Store();
    let size = 0;

    const rules: RestrictableRule[] = context.get(KeysRdfReason.rules) ?? [];
    // console.log('running with rules', rules)

    // const rules: RestrictableRule[] = action.rules ?? [
      // {
      //   premise: [
      //     quad(
      //       variable('?s'),
      //       namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      //       variable('?o'),
      //       defaultGraph()
      //     ),
      //     quad(
      //       variable('?o'),
      //       namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      //       variable('?o2'),
      //       defaultGraph()
      //     ),
      //   ],
      //   conclusion: [
      //     quad(
      //       variable('?s'),
      //       namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      //       variable('?o2'),
      //       defaultGraph()
      //     ),
      //   ]
      // }
    // ]


    do {
      size = store.size;
      const quadStreamInsert = evaluateRuleSet(rules, this.unionQuadSource(context).match)
        .map(data => {
          store.addQuad(data);
          return data;
        });
      await this.runImplicitUpdate({ quadStreamInsert }, context);
    } while (store.size > size);

    return {
      reasoned: Promise.resolve(),
    }
  }
}
