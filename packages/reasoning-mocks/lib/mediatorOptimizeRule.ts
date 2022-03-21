import { MediatorOptimizeRule } from "@comunica/bus-optimize-rule";

export const mediatorOptimizeRule = {
  async mediate(action) {
    return action;
  },
} as MediatorOptimizeRule;
