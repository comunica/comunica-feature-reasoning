/* eslint no-console: 0 */
import { KeysRdfResolveQuadPattern } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { mediators } from '@comunica/reasoning-mocks';
import type { IActionContext } from '@comunica/types';
import { generateDeepTaxonomy, TARGET_RESULT } from 'deep-taxonomy-benchmark';
import { Store } from 'n3';
import { ActorRdfReasonForwardChaining } from '../lib';

async function run(context: IActionContext, name: string) {
  const actor = new ActorRdfReasonForwardChaining({ name: 'actor', bus: new Bus({ name: 'bus' }), ...mediators });

  console.log(`actor initialized for ${name}...\n`);

  const TITLE = `Reasoning ${name} with ${context.get(KeysRdfReason.rules)}`;
  console.time(TITLE);

  const { execute } = await actor.run({ context });
  await execute();

  console.timeEnd(TITLE);
}

async function deepTaxonomy() {
  for (let i = 1; i <= 6; i++) {
    const destination = new Store();

    const TITLE = `test-dl-${10 ** i}.n3`;

    console.time(`Load ${TITLE}`);
    const store = generateDeepTaxonomy(10 ** i);
    console.timeEnd(`Load ${TITLE}`);

    console.log(store.size);

    const context = new ActionContext({
      [KeysRdfResolveQuadPattern.source.name]: store,
      [KeysRdfReason.data.name]: {
        status: { type: 'full', reasoned: false },
        dataset: destination,
        context: new ActionContext(),
      },
      [KeysRdfReason.rules.name]: 'type-inference',
    });

    await run(context, TITLE);

    console.log(destination.size, store.size);
    console.log(destination.has(TARGET_RESULT));
    console.log();
  }
}

deepTaxonomy()
  .catch(error => { console.error(error); });
