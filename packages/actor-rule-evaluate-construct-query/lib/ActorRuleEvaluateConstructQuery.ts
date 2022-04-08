import { ActorRuleEvaluate, IActionRuleEvaluate, IActorRuleEvaluateArgs, IActorRuleEvaluateOutput } from '@comunica/bus-rule-evaluate';
import { MediatorQueryOperation, ActorQueryOperation } from '@comunica/bus-query-operation';
import { IActorTest } from '@comunica/core';
import { Factory, Algebra } from 'sparqlalgebrajs';
import { empty } from 'asynciterator';
import * as RDF from '@rdfjs/types';
const factory = new Factory();

function quadToPattern(quad: RDF.Quad): Algebra.Pattern {
  return factory.createPattern(quad.subject, quad.predicate, quad.object, quad.graph);
}

/**
 * A Rule Evaluation actor that delegates the task to construct query actors
 */
export class ActorRuleEvaluateConstructQuery extends ActorRuleEvaluate {
  public readonly mediatorQueryOperation: MediatorQueryOperation;

  public constructor(args: IActorRuleEvaluateArgs) {
    super(args);
  }

  public async test(action: IActionRuleEvaluate): Promise<IActorTest> {
    // Must be a premise-conclusion styled rule
    return ["rdfs", "premise-conclusion", "nested-premise-conclusion"].includes(action.rule.ruleType)
      // Does not support using existing bindings
      && !action.quadStream
  }

  public async run({ rule: { premise, conclusion }, context }: IActionRuleEvaluate): Promise<IActorRuleEvaluateOutput> {
    if (!conclusion)
      return { results: empty() }
    const operation = factory.createConstruct(
      factory.createBgp(premise.map(quadToPattern)),
      conclusion.map(quadToPattern)
    );
    const results = ActorQueryOperation.getSafeQuads(await this.mediatorQueryOperation.mediate({ operation, context }));
    return { results: results.quadStream };
  }
}

export interface IActorRuleEvaluateConstructQueryArgs extends IActorRuleEvaluateArgs {
  mediatorQueryOperation: MediatorQueryOperation;
};
