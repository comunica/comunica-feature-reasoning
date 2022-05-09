const { Bus, ActionContext } = require('@comunica/core');
const { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } = require('@comunica/context-entries');
const { KeysRdfReason } = require('@comunica/reasoning-context-entries');
const { mediators } = require('@comunica/reasoning-mocks');
const { Store, Parser, DataFactory } = require('n3');
const { ActorRdfReasonRuleRestriction } = require('../lib');
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

async function run(name, rule, data) {
  const store = new Store();
  const destination = new Store();
  
  const actor = new ActorRdfReasonRuleRestriction({ name: 'actor', bus: new Bus({ name: 'bus' }), ...mediators });
  
  for (const d of data) {
    console.time(`Load ${d}`);  
    await load(d, store);
    console.timeEnd(`Load ${d}`);
  }

  const context = new ActionContext({
    [KeysRdfResolveQuadPattern.source.name]: store,
    [KeysRdfReason.data.name]: {
      status: { type: 'full', reasoned: false },
      dataset: destination,
      context: new ActionContext()
    },
    [KeysRdfReason.rules.name]: rule,
  });

  // console.log(`actor initialized for ${name}...\n`)
  
  const TITLE = `Reasoning ${name} with ${context.get(KeysRdfReason.rules)}`
  console.time(TITLE);

  const { execute } = await actor.run({ context });
  await execute();

  console.timeEnd(TITLE);

  return destination;
}

async function deepTaxonomy() {
  for (let i = 1; i <= 6; i++) {
    const destination = await run('Deep Taxonomy', 'type-inference', [`deep-taxonomy/test-dl-${10 ** i}.n3`]);

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

(async () => {
  const dest = await run('TimBL + FOAF', 'full-rdfs', ['./timbl.ttl', './foaf.ttl'])
  console.log(dest.size)
  console.log()

  await deepTaxonomy();
})();

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
