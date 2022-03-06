import { MediatorOptimizeRule } from '@comunica/bus-optimize-rule';
import type { MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import type {
  IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput, MediatorRdfUpdateQuads,
} from '@comunica/bus-rdf-update-quads';
import { MediatorRuleResolve } from '@comunica/bus-rule-resolve';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { Rule } from '@comunica/reasoning-types';
import type { IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { wrap, type AsyncIterator } from 'asynciterator';
import type { Algebra } from 'sparqlalgebrajs';
import type { IActionRdfReason, IActorRdfReasonOutput } from './ActorRdfReason';
import { ActorRdfReason, setImplicitDestination, setImplicitSource, setUnionSource } from './ActorRdfReason';

export abstract class ActorRdfReasonMediated extends ActorRdfReason implements IActorRdfReasonMediatedArgs {
  public readonly mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;

  public readonly mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;

  public readonly mediatorRuleResolve: MediatorRuleResolve;

  public readonly mediatorOptimizeRule: MediatorOptimizeRule;

  public constructor(args: IActorRdfReasonMediatedArgs) {
    super(args);
  }

  protected async runExplicitUpdate(changes: IActionRdfUpdateQuads): Promise<IActorRdfUpdateQuadsOutput> {
    return this.mediatorRdfUpdateQuads.mediate(changes);
  }

  protected async runImplicitUpdate(action: IActionRdfUpdateQuads): Promise<IActorRdfUpdateQuadsOutput> {
    return this.runExplicitUpdate({ ...action, context: setImplicitDestination(action.context) });
  }

  protected explicitQuadSource(context: IActionContext) {
    return {
      match: (pattern: Algebra.Pattern): AsyncIterator<RDF.Quad> => wrap(
        this.mediatorRdfResolveQuadPattern.mediate({ context, pattern }).then(({ data }) => data),
      ),
    };
  }

  protected implicitQuadSource(context: IActionContext) {
    return this.explicitQuadSource(setImplicitSource(context));
  }

  protected unionQuadSource(context: IActionContext) {
    return this.explicitQuadSource(setUnionSource(context));
  }

  public async getRules(action: IActionRdfReason) {
    const { data } = await this.mediatorRuleResolve.mediate(action);
    const { rules } = await this.mediatorOptimizeRule.mediate({ rules: data, ...action });
    return rules;
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    return {
      execute: async () => {
        await this.execute({ ...action, rules: await (await this.getRules(action)).toArray(), });
      }
    }
  }

  public abstract execute(action: IActionRdfReasonExecute): Promise<void>;
}

export interface IActionRdfReasonExecute extends IActionRdfReason {
  rules: Rule[];
}

export interface IActorRdfReasonMediatedArgs
  extends IActorArgs<IActionRdfReason, IActorTest, IActorRdfReasonOutput> {
  mediatorRdfUpdateQuads: MediatorRdfUpdateQuads;
  mediatorRdfResolveQuadPattern: MediatorRdfResolveQuadPattern;
  mediatorRuleResolve: MediatorRuleResolve;
  mediatorOptimizeRule: MediatorOptimizeRule;
}
