import type { MediatorQueryOperation } from '@comunica/bus-query-operation';
import { ActorQueryOperation } from '@comunica/bus-query-operation';
import type {
  IActionRuleEvaluate,
  IActorRuleEvaluateArgs,
  IActorRuleEvaluateOutput,
} from '@comunica/bus-rule-evaluate';
import { ActorRuleEvaluate } from '@comunica/bus-rule-evaluate';
import type { IActorTest } from '@comunica/core';
import type * as RDF from '@rdfjs/types';
import { ArrayIterator } from 'asynciterator';
import type { Algebra } from 'sparqlalgebrajs';
import { Factory } from 'sparqlalgebrajs';

const factory = new Factory();

function quadToPattern(quad: RDF.Quad): Algebra.Pattern {
  return factory.createPattern(quad.subject, quad.predicate, quad.object, quad.graph);
}

/**
 * A Rule Evaluation actor that delegates the task to construct query actors
 */
export class ActorRuleEvaluateConstructQuery extends ActorRuleEvaluate {
  public readonly mediatorQueryOperation: MediatorQueryOperation;

  public constructor(args: IActorRuleEvaluateConstructQueryArgs) {
    super(args);
  }

  public async test(action: IActionRuleEvaluate): Promise<IActorTest> {
    // Must be a premise-conclusion styled rule
    if (![ 'rdfs', 'premise-conclusion', 'nested-premise-conclusion' ].includes(action.rule.ruleType)) {
      throw new Error(`${this.name}: Cannot handle rule type ${action.rule.ruleType}`);
    }
    // Does not support using existing bindings
    if (action.quadStream) {
      throw new Error(`${this.name}: Cannot handle existing bindings`);
    }
    return true;
  }

  public async run({ rule: { premise, conclusion }, context }: IActionRuleEvaluate): Promise<IActorRuleEvaluateOutput> {
    if (!conclusion) {
      return { results: new ArrayIterator([], { autoStart: false }) };
    }
    const operation = factory.createConstruct(
      factory.createBgp(premise.map(quadToPattern)),
      conclusion.map(quadToPattern),
    );
    const results = ActorQueryOperation.getSafeQuads(await this.mediatorQueryOperation.mediate({ operation, context }));
    return { results: results.quadStream };
  }
}

export interface IActorRuleEvaluateConstructQueryArgs extends IActorRuleEvaluateArgs {
  mediatorQueryOperation: MediatorQueryOperation;
}
