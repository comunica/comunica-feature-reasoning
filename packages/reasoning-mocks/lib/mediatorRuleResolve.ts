import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import type { Rule } from '@comunica/reasoning-types';
import { fromArray } from '../../actor-rdf-reason-forward-chaining/lib/asynciterator';
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
    premise: [quad(
      variable('?s'),
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      variable('?o'),
      // variable('?g'),
    ),
    quad(
      variable('?o'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      variable('?o2'),
      // variable('?g'),
    )],
    conclusion: [
        quad(
        variable('?s'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        variable('?o2'),
        // variable('?g'),
      ),
    ],
  }],
  'full-rdfs': [{
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?s'),
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      variable('?o'),
    ),quad(
      variable('?o'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      variable('?o2'),
    )],
    conclusion: [
      quad(
        variable('?s'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        variable('?o2'),
      ),
    ]
  },
  {
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?s'),
      variable('?p'),
      variable('?o'),
    )],
    conclusion: [
      quad(
        variable('?p'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'),
      ),
    ]
  },
  {
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?a'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#domain'),
      variable('?x'),
    ),quad(
      variable('?u'),
      variable('?a'),
      variable('?y'),
    )],
    conclusion: [
      quad(
        variable('?u'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        variable('?x'),
      ),
    ]
  },
  {
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?a'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#range'),
      variable('?x'),
    ),quad(
      variable('?u'), // With rules like this we *do not* need to iterate over the subject index so we should avoid doing so
      variable('?a'),
      variable('?v'),
    )],
    conclusion: [
      quad(
        variable('?v'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        variable('?x'),
      ),
    ]
  },
  {
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?u'),
      variable('?a'),
      variable('?x'),
    )],
    conclusion: [
      quad(
        variable('?u'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#Resource'),
      ),
      quad(
        variable('?x'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#Resource'),
      ),
    ]
  },
  {
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?u'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#subPropertyOf'),
      variable('?v'),
    ),quad(
      variable('?v'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#subPropertyOf'),
      variable('?x'),
    )],
    conclusion: [
      quad(
        variable('?u'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#subPropertyOf'),
        variable('?x'),
      )
    ]
  },
  {
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?u'),
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#Class'),
    )],
    conclusion: [
      quad(
        variable('?u'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#Resource'),
      )
    ]
  },
  {
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?u'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      variable('?x'),
    ), quad(
      variable('?v'),
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      variable('?u'),
    )],
    conclusion: [
      quad(
        variable('?v'),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        variable('?x'),
      )
    ]
  },{
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?u'),
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#Class'),
    )],
    conclusion: [
      quad(
        variable('?u'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
        variable('?u'),
      )
    ]
  },
  {
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?u'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      variable('?v'),
    ),quad(
      variable('?v'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      variable('?x'),
    )],
    conclusion: [
      quad(
        variable('?u'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
        variable('?x'),
      )
    ]
  },{
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?u'),
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#ContainerMembershipProperty'),
    )],
    conclusion: [
      quad(
        variable('?u'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#subPropertyOf'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#member'),
      )
    ]
  },
  {
    ruleType: 'premise-conclusion',
    premise: [quad(
      variable('?u'),
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode('http://www.w3.org/2000/01/rdf-schema#Datatype'),
    )],
    conclusion: [
      quad(
        variable('?u'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
        namedNode('http://www.w3.org/2000/01/rdf-schema#Literal'),
      )
    ]
  },
  ]
};

export const mediatorRuleResolve = <any> {
  async mediate(action: any): Promise<any> {
    const ruleString: string = action.context.get(KeysRdfReason.rules)!;
    return {
      data: fromArray<Rule>(RULES[ruleString]),
    };
  },
};
