import type { IActionRuleResolve, IActorRuleResolveOutput, MediatorRuleResolve } from '@comunica/bus-rule-resolve';
import { ActionContextKey } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import { fromArray } from 'asynciterator';
import { DataFactory } from 'n3';
const { quad, variable, namedNode } = DataFactory;

const KEY_RDF_REASON_RULES = new ActionContextKey<any>('@comunica/bus-rdf-reason:rules');

export const mediatorRuleResolve = <MediatorRuleResolve> {
  async mediate(action: IActionRuleResolve): Promise<IActorRuleResolveOutput> {
    const ruleString: string = action.context.get(KEY_RDF_REASON_RULES)!;
    return {
      data: fromArray<Rule>(RULES[ruleString]),
    };
  },
};

const RULES: Record<string, Rule[]> = {
  'my-unnested-rules': [
    {
      ruleType: 'premise-conclusion',
      premise: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?o'),
          variable('?g'),
        ),
        quad(
          variable('?o'),
          namedNode('http://example.org#subsetOf'),
          variable('?o2'),
          variable('?g'),
        ),
      ],
      conclusion: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?o2'),
          variable('?g'),
        ),
      ],
    },
    {
      ruleType: 'premise-conclusion',
      premise: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?o'),
          variable('?g'),
        ),
      ],
      conclusion: [
        quad(
          variable('?o'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
          variable('?g'),
        ),
      ],
    },
  ],
  'my-nested-rules': [
    {
      ruleType: 'nested-premise-conclusion',
      premise: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?o'),
          variable('?g'),
        ),
      ],
      conclusion: [
        quad(
          variable('?o'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
          variable('?g'),
        ),
      ],
      next: {
        premise: [
          quad(
            variable('?o'),
            namedNode('http://example.org#subsetOf'),
            variable('?o2'),
            variable('?g'),
          ),
        ],
        conclusion: [
          quad(
            variable('?s'),
            namedNode('http://example.org#a'),
            variable('?o2'),
            variable('?g'),
          ),
        ],
      },
    },
  ],
  'my-repeated-var-rules': [
    {
      ruleType: 'premise-conclusion',
      premise: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?s'),
          variable('?g'),
        ),
      ],
      conclusion: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Thing'),
          variable('?g'),
        ),
      ],
    },
  ],
};
