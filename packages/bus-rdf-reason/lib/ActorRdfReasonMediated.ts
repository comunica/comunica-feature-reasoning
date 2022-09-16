import type { MediatorOptimizeRule } from '@comunica/bus-optimize-rule';
import type { MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import type {
  IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput, MediatorRdfUpdateQuads,
} from '@comunica/bus-rdf-update-quads';
import type { MediatorRuleResolve } from '@comunica/bus-rule-resolve';
import type { IActorArgs, IActorTest } from '@comunica/core';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import type { Rule, IReasonStatus, IReasonGroup } from '@comunica/reasoning-types';
import type { IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { wrap, type AsyncIterator } from 'asynciterator';
import { matchPatternMappings } from 'rdf-terms';
import type { Algebra } from 'sparqlalgebrajs';
import type { IActionRdfReason, IActorRdfReasonOutput } from './ActorRdfReason';
import {
  setReasoningStatus, ActorRdfReason, setImplicitDestination, setUnionSource,
} from './ActorRdfReason';

export abstract class ActorRdfReasonMediated extends ActorRdfReason {
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

  protected explicitQuadSource(context: IActionContext): {
    match: (pattern: Algebra.Pattern) => AsyncIterator<RDF.Quad>;
  } {
    return {
      match: (pattern: Algebra.Pattern): AsyncIterator<RDF.Quad> => wrap(
        this.mediatorRdfResolveQuadPattern.mediate({ context, pattern }).then(({ data }) => data),
        { autoStart: false },
      ),
    };
  }

  // TODO: See if we need to add this back in
  // protected implicitQuadSource(context: IActionContext): {
  //   match: (pattern: Algebra.Pattern) => AsyncIterator<RDF.Quad>
  // } {
  //   return this.explicitQuadSource(setImplicitSource(context));
  // }

  protected unionQuadSource(context: IActionContext): { match: (pattern: Algebra.Pattern) => AsyncIterator<RDF.Quad> } {
    return this.explicitQuadSource(setUnionSource(context));
  }

  // TODO [FUTURE]: Push this into a specific abstract interface for language agnostic reasoners.
  public getRules(action: IActionRdfReason): AsyncIterator<Rule> {
    const getRules = async(): Promise<AsyncIterator<Rule>> => {
      const { data } = await this.mediatorRuleResolve.mediate(action);
      const { rules } = await this.mediatorOptimizeRule.mediate({ rules: data, ...action });
      return rules;
    };
    // Ok - so the problem is here with the autoStarting behavior
    return wrap<Rule>(getRules(), { autoStart: false });
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    return {
      execute: async(): Promise<void> => {
        const { updates, pattern } = action;
        if (updates) {
          // If there is an update - forget everything we know about the current status of reasoning
          setReasoningStatus(action.context, { type: 'full', reasoned: false });
        }

        const { status } = action.context.getSafe<IReasonGroup>(KeysRdfReason.data);

        // If full reasoning is already being applied then just use the data from that
        if (status.type === 'full' && status.reasoned) {
          return status.done;
        }

        // If we have already done partial reasoning and are only interested in a certain
        // pattern then maybe we can use that
        if (status.type === 'partial' && pattern) {
          for (const [ key, value ] of status.patterns) {
            if (value.reasoned && matchPatternMappings(pattern, key)) {
              return value.done;
            }
          }
        }
        this.logInfo(action.context, 'Starting reasoning ...');
        const reasoningLock = this.execute({ ...action, rules: await this.getRules(action).toArray() });

        if (pattern) {
          // Set reasoning whole
          const patterns: Map<RDF.BaseQuad, IReasonStatus> = status.type === 'partial' ? status.patterns : new Map();
          setReasoningStatus(action.context, {
            type: 'partial',
            patterns: patterns.set(pattern, { type: 'full', reasoned: true, done: reasoningLock }),
          });
        } else {
          setReasoningStatus(action.context, { type: 'full', reasoned: true, done: reasoningLock });
        }

        return reasoningLock;
      },
    };
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
