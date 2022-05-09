import type { Rule } from '@comunica/reasoning-types';
import { fromArray } from '../../actor-rdf-reason-forward-chaining/lib/asynciterator';
import { RULES } from './mediatorRuleResolve';

export const mediatorDereferenceRule = <any> {
  async mediate(action: any) {
    return {
      data: fromArray<Rule>(RULES[action.url]),
    };
  },
};
