import type { MediatorOptimizeRule } from '@comunica/bus-optimize-rule';

export const mediatorOptimizeRule = <MediatorOptimizeRule> {
  async mediate(action) {
    return action;
  },
};
