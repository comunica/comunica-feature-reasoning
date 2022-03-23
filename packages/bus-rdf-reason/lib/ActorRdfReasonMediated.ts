import type { MediatorOptimizeRule } from '@comunica/bus-optimize-rule';
import type { IActorRdfResolveQuadPatternArgs, IActorRdfResolveQuadPatternOutput, MediatorRdfResolveQuadPattern } from '@comunica/bus-rdf-resolve-quad-pattern';
import type {
  IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput, MediatorRdfUpdateQuads,
} from '@comunica/bus-rdf-update-quads';
import type { MediatorRuleResolve } from '@comunica/bus-rule-resolve';
import type { IActorArgs, IActorTest } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import type { IActionContext } from '@comunica/types';
import type * as RDF from '@rdfjs/types';
import { wrap, type AsyncIterator } from 'asynciterator';
import type { Algebra } from 'sparqlalgebrajs';
import { getSafeData, IActionRdfReason, IActorRdfReasonOutput, IReasonStatus, setReasoningStatus } from './ActorRdfReason';
import { ActorRdfReason, setImplicitDestination, setImplicitSource, setUnionSource } from './ActorRdfReason';
import { everyTerms } from 'rdf-terms'

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

  protected explicitQuadSource(context: IActionContext): { match: (pattern: Algebra.Pattern) => AsyncIterator<RDF.Quad> } {
    return {
      match: (pattern: Algebra.Pattern): AsyncIterator<RDF.Quad> => wrap(
        this.mediatorRdfResolveQuadPattern.mediate({ context, pattern }).then(({ data }) => data),
      ),
    };
  }

  protected implicitQuadSource(context: IActionContext): { match: (pattern: Algebra.Pattern) => AsyncIterator<RDF.Quad> } {
    return this.explicitQuadSource(setImplicitSource(context));
  }

  protected unionQuadSource(context: IActionContext): { match: (pattern: Algebra.Pattern) => AsyncIterator<RDF.Quad> } {
    return this.explicitQuadSource(setUnionSource(context));
  }

  // TODO [FUTURE]: Push this into a specific abstract interface for language agnostic reasoners.
  public getRules(action: IActionRdfReason): AsyncIterator<Rule> {
    const getRules = async() => {
      const { data } = await this.mediatorRuleResolve.mediate(action);
      const { rules } = await this.mediatorOptimizeRule.mediate({ rules: data, ...action });
      return rules;
    };
    return wrap<Rule>(getRules());
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    return {
      execute: async() => {
        const { updates, pattern } = action;
        if (updates) {
          // If there is an update - forget everything we know about the current status of reasoning
          setReasoningStatus(action.context, { type: 'full', reasoned: false });
        }

        const { status } = getSafeData(action.context);

        // If full reasoning is already being applied then just use the data from that
        if (status.type === 'full' && status.reasoned) {
          return status.done;
        }

        // TODO: Double check this matches function
        function matches(term1: RDF.BaseQuad, term2: RDF.BaseQuad) {
          const mapping: Record<string, RDF.Term> = {};
          return everyTerms(term1, (term, key) => {
            if (term.termType === 'Variable') {
              if (term.value in mapping) {
                return mapping[term.value].equals(term2[key]);
              }
              } else {
                mapping[term.value] = term2[key];
                return true;
              }
              return term.equals(term2[key]);
            })       
        }

        // If we have already done partial reasoning and are only interested in a certain
        // pattern then maybe we can use that
        if (status.type === 'partial' && pattern) {
          for (const [key, value] of status.patterns) {
            if (value.reasoned && matches(pattern, key)) {
              return value.done;
            }
          }
        }

        const reasoningLock = this.execute({ ...action, rules: await this.getRules(action).toArray() });

        if (action.pattern) {
          // Set reasoning whole
          const patterns: Map<RDF.BaseQuad, IReasonStatus> = status.type === 'partial' ? status.patterns : new Map();
          setReasoningStatus(action.context, { type: 'partial', patterns: patterns.set(action.pattern, { type: 'full', reasoned: true, done: reasoningLock }) });
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
