import { ActorRdfReason, IActionRdfReason, IActorRdfReasonMediatedArgs, IActorRdfReasonOutput, IReason, IReasonOutput } from '@comunica/bus-rdf-reason';
import { Mediator, Actor, IActorArgs, IActorTest } from '@comunica/core';
import { IActionQueryOperation, IActorQueryOperationOutput, ActorQueryOperation } from '@comunica/bus-query-operation';
import { Rule } from '@comunica/bus-rule-parse';
import { Factory, Algebra } from 'sparqlalgebrajs'
import * as RDF from '@rdfjs/types'
import { ActionContext } from '@comunica/types';
import { wrap } from 'asynciterator'

const factory = new Factory();

function quadsToPatterns(quads: RDF.Quad[]): Algebra.Pattern[] {
  return quads.map(quad => {
    return factory.createPattern(quad.subject, quad.predicate, quad.object, quad.graph)
  })
}

function ruleToConstruct({ premise, conclusion }: Rule): Algebra.DeleteInsert {
  if (conclusion === false) {
    throw new Error('False conclusion in rule not handled')
  }

  return factory.createDeleteInsert(
    undefined,
    quadsToPatterns(conclusion),
    factory.createBgp(quadsToPatterns(premise)),
  )
}

/**
 * A comunica Construct Query Reasoner RDF Reason Actor.
 */
export class ActorRdfReasonConstructQuery extends ActorRdfReason {
  public readonly mediatorQueryOperation: Mediator<Actor<IActionQueryOperation, IActorTest, IActorQueryOperationOutput>,
  IActionQueryOperation, IActorTest, IActorQueryOperationOutput>;

  public constructor(args: IActorRdfReasonConstructQueryArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    const context = ActorRdfReason.getContext(action.context);
    
    do {
      const applications = action.settings.rules.map(async rule => {
        const result = await this.mediatorQueryOperation.mediate({
          operation: ruleToConstruct(rule),
          context: ActorRdfReason.setImplicitDestination(ActorRdfReason.setUnionSource(context)),
        });
        await ActorQueryOperation.getSafeUpdate(result).updateResult;
      });
      await Promise.all(applications);
      // TODO [FIX]: Work out how to find a good stopping condition (no new rules created)
    } while (false);

    return { implicitSource: ActorRdfReason.getImplicitSource(context) }; // TODO implement
  }
}

export interface IActorRdfReasonConstructQueryArgs
  extends IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput> {
  mediatorQueryOperation: Mediator<Actor<IActionQueryOperation, IActorTest, IActorQueryOperationOutput>,
  IActionQueryOperation, IActorTest, IActorQueryOperationOutput>;
}
