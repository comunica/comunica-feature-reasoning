#!/usr/bin/env node
const N3 = require('n3');
const fs = require('fs'),
    path = require('path'),
    assert = require('assert');
    // RDFS = require('./rdfs');
const rdfParser = require("rdf-parse").default;
const { Bus, ActionContext } = require('@comunica/core');
const { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } = require('@comunica/context-entries');
const { KeysRdfReason } = require('@comunica/reasoning-context-entries');
const { mediators } = require('@comunica/reasoning-mocks');
const { Store, Parser, DataFactory } = require('n3');
const { ActorRdfReasonRuleRestriction } = require('../../actor-rdf-reason-rule-restriction/lib/ActorRdfReasonRuleRestriction');

function load(filename, store) {
  return new Promise((res, rej) => {
   rdfParser.parse(fs.createReadStream(path.join(__dirname, filename)), { path: filename, baseIRI: 'http://example.org' })
    .on('data', quad => store.add(quad))
    .on('end', res)
    .on('err', rej)
  })
}

async function deepTaxonomy() {
  for (let i = 1; i <= 6; i++) {
    const store = new N3.Store();
    const TITLE = `test-dl-${10 ** i}.n3`;
    
    console.time(`Load ${TITLE}`);  
    await load(`data/deep-taxonomy/${TITLE}`, store);
    console.timeEnd(`Load ${TITLE}`);

    console.time(`Reasoning: ${TITLE}`);
    store.reason(SUBCLASS_RULE)
    console.timeEnd(`Reasoning: ${TITLE}`)

    console.log(store.has(
      new Quad(
        new NamedNode('http://eulersharp.sourceforge.net/2009/12dtb/test#ind'),
        new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        new NamedNode('http://eulersharp.sourceforge.net/2009/12dtb/test#A2'),
      ),
    ))
  

    console.log()
  }
}

async function run() {
  const store = new N3.Store();
  console.time('loading foaf ontology');
  await load('./data/foaf.ttl', store);
  console.timeEnd('loading foaf ontology');

  console.time('loading tim berners lee profile card');
  await load('./data/timbl.ttl', store);
  console.timeEnd('loading tim berners lee profile card');

  console.time('apply reasoning');
  store.reason(RDFS);

  console.timeEnd('apply reasoning');
}

async function reasonerChallenge(rule = RDFS) {
  const store = new N3.Store();
  console.time('loading abox ontology');
  await load('./data/reasoner-challenge/abox.ttl', store);
  console.timeEnd('loading abox ontology');

  console.time('loading tbox');
  await load('./data/reasoner-challenge/tbox.ttl', store);
  console.timeEnd('loading tbox');

  console.time('apply reasoning');
  store.reason(rule);

  console.timeEnd('apply reasoning');
}

async function LUBM(rule, univ = 1) {
  const store = new N3.Store();
  console.time('loading abox ontology');

  for (let u = 0; u < univ; u++) {
    for (let i = 0; i < 25; i++) {
      if (fs.existsSync(path.join(__dirname, `./lubm-gen/src/University${u}_${i}.owl`))) {
        await load(`./lubm-gen/src/University${u}_${i}.owl`, store);
      }
      // try {
      //   await load(`./lubm-gen/src/University${u}_${i}.owl`, store);
      // } catch (e) {

      // }
    }
  }
  
  console.timeEnd('loading abox ontology');
  console.log(store.size)
    
  // console.time('loading tbox');
  // await load('./data/reasoner-challenge/tbox.ttl', store);
  // console.timeEnd('loading tbox');

  console.time('apply reasoning');
  await run('LUBM', rule, store)

  // store.reason(rule);
  console.timeEnd('apply reasoning');

  console.log(store.size)
}

(async () => {
  for (const i of [1, 5, 10, 20, 30, 40, 50]) {
    console.log(`\nRunning LUBM ${i}`)
    await LUBM('full-rdfs', i);
  }

  // console.log('\nReasoning over TimBL profile and FOAF')
  // await run();

  // // console.log('\nRun Reasoner Challenge');
  // // await reasonerChallenge();

  // console.log('\nRun Reasoner Challenge Subclass Rule Only');
  // await reasonerChallenge(SUBCLASS_RULE);

  // console.log('\n\nRunning Deep Taxonomy Benchmark\n')
  // await deepTaxonomy();
})();



async function run(name, rule, store) {
  const destination = store;
  // const destination = new Store();
  
  const actor = new ActorRdfReasonRuleRestriction({ name: 'actor', bus: new Bus({ name: 'bus' }), ...mediators });

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