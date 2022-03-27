import { ActionContextKey } from '@comunica/core';

const KEY_RDF_REASON_DATA = new ActionContextKey<any>('@comunica/bus-rdf-reason:data');
// TODO: Clean up after https://github.com/comunica/comunica/issues/945 is closed
export function getSafeData(context: any): any {
  const data = context.get(KEY_RDF_REASON_DATA);
  if (!data) {
    throw new Error(`Context entry ${KEY_RDF_REASON_DATA.name} is required but not available`);
  }
  return data;
}

export function setReasoningStatus(context: any, status: any): any {
  getSafeData(context).status = status;
  return context;
}

// Returns a promise that resolves after timeout milliseconds.
function timedPromise(timeout: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export const mediatorRdfReason = <any> {
  async mediate(action: any) {
    return { async execute() {
      setReasoningStatus(action.context, { type: 'full', done: timedPromise(10), reasoned: true });
    } };
  },
};
