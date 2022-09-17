import * as path from 'path';
import { generateDeepTaxonomy, TARGET_RESULT } from 'deep-taxonomy-benchmark';
import { Factory } from 'sparqlalgebrajs';
import { QueryEngine } from '../lib';

const rounds = Number(process.argv[2])

async function deepTaxonomy(extended = false) {
  for (let i = 1; i <= (rounds ?? 6); i++) {
    const engine = new QueryEngine();
    const factory = new Factory();

    const TITLE = `test-dl-${10 ** i}.n3`;
    const store = generateDeepTaxonomy(10 ** i, extended);

    // eslint-disable-next-line no-console
    console.time(`Reasoning: ${TITLE}`);

    const result = await engine.queryBoolean(
      factory.createAsk(factory.createPattern(TARGET_RESULT.subject, TARGET_RESULT.predicate, TARGET_RESULT.object)),
      {
        sources: [ store ],
        rules: path.join(__dirname, 'subclass.n3'),
      },
    );
    if (!result) {
      throw new Error('Target result not found');
    }
    // eslint-disable-next-line no-console
    console.timeEnd(`Reasoning: ${TITLE}`);
  }
}

deepTaxonomy()
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
  });
