import { IActionRdfReason, IActorRdfReasonOutput, IActorRdfReasonMediatedArgs, KeysRdfReason, ActorRdfReason } from '@comunica/bus-rdf-reason';
import { ActorRdfReasonMediated } from '@comunica/bus-rdf-reason';
import { IActorTest } from '@comunica/core';
import { MediatorRuleDereference } from '@comunica/bus-rule-dereference'
import { Store } from 'n3'
import { evaluateRuleSet, RestrictableRule } from './reasoner';
import streamifyArray = require('streamify-array');
import arrayifyStream = require('arrayify-stream');
import { defaultGraph, quad } from '@rdfjs/data-model';
import { MediatorOptimizeRule } from '@comunica/bus-optimize-rule'

/**
 * A comunica actor that 
 */
export class ActorRdfReasonRuleRestriction extends ActorRdfReasonMediated {
  public readonly mediatorRuleDereference: MediatorRuleDereference;
  public readonly mediatorOptimizeRule: MediatorOptimizeRule;
  public constructor(args: IActorRdfReasonRuleRestrictionArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    if (!action.context?.has(KeysRdfReason.dataset) || !action.context?.has(KeysRdfReason.dataset)) {
      throw new Error('Missing dataset or rule context')
    }
    return true; // TODO implement
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    const { context } = action;

    if (!context) {
      throw new Error('Context required for reasoning')
    }

    const store = new Store();
    let size = 0;
    // console.log('rule dereference', this.mediatorRuleDereference)
    const d = await this.mediatorRuleDereference.mediate({ url: context.get(KeysRdfReason.rules) })
    const originalRules = await arrayifyStream(d.rules);
    const { rules } = await this.mediatorOptimizeRule.mediate({ rules: originalRules, pattern: action.pattern })

    // console.log(rules.length, originalRules.length)
    // console.log(r)
    // console.log(r[0].premise)
    // console.log(r[0].conclusion)
    // const rules: RestrictableRule[] = context.get(KeysRdfReason.rules) ?? [];

    do {
      size = store.size;
      const quadStreamInsert = evaluateRuleSet(rules as RestrictableRule[], this.unionQuadSource(context).match)
        .map(data => {
          store.addQuad(data);
          return data;
        });
      await this.runImplicitUpdate({ quadStreamInsert }, context);
      // console.log('implicit size', size)
    } while (store.size > size);

    return {
      reasoned: Promise.resolve(),
    }
  }
}

interface IActorRdfReasonRuleRestrictionArgs extends IActorRdfReasonMediatedArgs {
  mediatorRuleDereference: MediatorRuleDereference;
  mediatorOptimizeRule: MediatorOptimizeRule;
}
