import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import type { Rule } from '@comunica/reasoning-types';
import { fromArray } from 'asynciterator';
import { DataFactory } from 'n3';

const { quad, variable, namedNode } = DataFactory;

export const RULES: Record<string, Rule[]> = {
  'multi-conclusion-rules': [
    {
      ruleType: 'premise-conclusion',
      premise: [
        quad(
          variable('?s'),
          variable('?p'),
          variable('?o'),
          variable('?g'),
        ),
      ],
      conclusion: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Thing1'),
          variable('?g'),
        ),
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Thing2'),
          variable('?g'),
        ),
      ],
    },
  ],
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
  'type-inference': [{
    ruleType: 'premise-conclusion',
    premise: [ quad(
      variable('?s'),
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      variable('?o'),
      variable('?g'),
    ),
    quad(
      variable('?o'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      variable('?o2'),
    ) ],
    conclusion: [
      quad(
        variable('?s'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        variable('?o2'),
      ),
    ],
  }],
  'overlapping-variables': [{
    ruleType: 'premise-conclusion',
    premise: [ quad(
      variable('?s'),
      variable('?s'),
      variable('?s'),
    ) ],
    conclusion: [
      quad(
        variable('?s'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://example.org/repeated'),
      ),
    ],
  }],
};

export const mediatorRuleResolve = <any> {
  async mediate(action: any): Promise<any> {
    const ruleString: string = action.context.get(KeysRdfReason.rules)!;
    return {
      data: fromArray<Rule>(RULES[ruleString]),
    };
  },
};
