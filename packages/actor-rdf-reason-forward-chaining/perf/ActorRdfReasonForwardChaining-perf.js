const { Bus, ActionContext } = require('@comunica/core');
const { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } = require('@comunica/context-entries');
const { KeysRdfReason } = require('@comunica/reasoning-context-entries');
const { mediators } = require('@comunica/reasoning-mocks');
const { Store, Parser, DataFactory } = require('n3');
const { ActorRdfReasonForwardChaining } = require('../lib');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const { quad, namedNode } = DataFactory;

function load(filename, store) {
  return new Promise((res) => {
    new Parser({ baseIRI: 'http://example.org' }).parse(fs.createReadStream(path.join(__dirname, filename)), (error, quad) => {
      assert(!error, error);
      if (quad)
        store.add(quad);
      else {
        res();
      }
    });

  })
}

async function run(context, name) {
  const actor = new ActorRdfReasonForwardChaining({ name: 'actor', bus: new Bus({ name: 'bus' }), ...mediators });
  
  console.log(`actor initialized for ${name}...\n`)
  
  const TITLE = `Reasoning ${name} with ${context.get(KeysRdfReason.rules)}`
  console.time(TITLE);

  const { execute } = await actor.run({ context });
  await execute();

  console.timeEnd(TITLE);
}

async function deepTaxonomy() {
  for (let i = 1; i <= 6; i++) {
    const store = new Store();
    const destination = new Store();

    const TITLE = `test-dl-${10 ** i}.n3`;

    console.time(`Load ${TITLE}`);  
    await load(`deep-taxonomy/${TITLE}`, store);
    console.timeEnd(`Load ${TITLE}`);

    console.log(store.size);

    const context = new ActionContext({
      [KeysRdfResolveQuadPattern.source.name]: store,
      [KeysRdfReason.data.name]: {
        status: { type: 'full', reasoned: false },
        dataset: destination,
        context: new ActionContext()
      },
      [KeysRdfReason.rules.name]: 'type-inference',
    });

    await run(context, TITLE);

    console.log(destination.size, store.size);
    // console.log(destination.getQuads())
    console.log(destination.has(
      quad(
        namedNode('http://eulersharp.sourceforge.net/2009/12dtb/test#ind'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://eulersharp.sourceforge.net/2009/12dtb/test#A2'),
      ),
    ))


    console.log()
  }
}

deepTaxonomy();

// const context = new ActionContext({
//   [KeysRdfResolveQuadPattern.source.name]: new Store(),
//   [KeysRdfReason.data.name]: {
//     status: { type: 'full', reasoned: false },
//     dataset: new Store(),
//     context: new ActionContext()
//   },
//   [KeysRdfReason.rules.name]: 'type-inference',
// });



// run(context, 'timbl');
