import { KeysRdfDereferenceConstantHylar } from '@comunica/reasoning-context-entries';
import { getTimblAndFoaf } from 'deep-taxonomy-benchmark';
import { promisifyEventEmitter } from 'event-emitter-promisify';
import { QueryEngine } from '../lib';

async function main() {
  const engine = new QueryEngine();
  const store = await getTimblAndFoaf();

  // eslint-disable-next-line no-console
  console.time('Reasoning over TIMBL and FOAF - RDFS');
  const result = await engine.queryBindings(
    'SELECT * WHERE { ?s ?p ?o }',
    {
      sources: [ store ],
      rules: KeysRdfDereferenceConstantHylar.rdfs,
    },
  );
  await promisifyEventEmitter(result.on('data', () => { /* Noop */ }));
  // eslint-disable-next-line no-console
  console.timeEnd('Reasoning over TIMBL and FOAF - RDFS');

  // eslint-disable-next-line no-console
  console.time('Reasoning over TIMBL and FOAF - OWL2RL');
  const resultowl = await engine.queryBindings(
    'SELECT * WHERE { ?s ?p ?o }',
    {
      sources: [ store ],
      rules: KeysRdfDereferenceConstantHylar.owl2rl,
    },
  );
  await promisifyEventEmitter(resultowl.on('data', () => { /* Noop */ }));
  // eslint-disable-next-line no-console
  console.timeEnd('Reasoning over TIMBL and FOAF - OWL2RL');
}

main()
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
  });
