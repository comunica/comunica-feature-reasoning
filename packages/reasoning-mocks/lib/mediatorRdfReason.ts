import type { MediatorRdfReason } from '@comunica/bus-rdf-reason';
import { setContextReasoning } from '@comunica/bus-rdf-reason';

// Returns a promise that resolves after timeout milliseconds.
function timedPromise(timeout: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export const mediatorRdfReason = {
  async mediate(action) {
    return { async execute() {
      setContextReasoning(action.context, timedPromise(10));
    } };
  },
} as MediatorRdfReason;
