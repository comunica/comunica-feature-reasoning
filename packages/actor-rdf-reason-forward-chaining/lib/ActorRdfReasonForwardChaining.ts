import { ActorRdfReasonMediated, IActionRdfReason, IActionRdfReasonExecute, IActorRdfReasonMediatedArgs, setImplicitDestination, setUnionSource } from '@comunica/bus-rdf-reason';
import { MediatorRdfUpdateQuadsInfo } from '@comunica/bus-rdf-update-quads-info';
import { MediatorRuleEvaluate } from '@comunica/bus-rule-evaluate';
import { IActorTest } from '@comunica/core';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { IReasonGroup, Rule } from '@comunica/reasoning-types';
import { IActionContext } from '@comunica/types';
import * as RDF from '@rdfjs/types';
import { ArrayIterator, AsyncIterator, fromArray, UnionIterator } from 'asynciterator';
import { forEachTerms, mapTerms } from 'rdf-terms';
import { matchPatternMappings } from 'rdf-terms/lib/QuadTermUtil';
import { getQuads } from 'rdf-terms/lib/TermUtil';
import { maybeIterator, WrappingIterator } from './util';

interface IRuleNode {
  rule: Rule;
  next: { rule: IRuleNode, index: number }[];
}

interface IConsequenceData {
  quads: AsyncIterator<RDF.Quad>;
  rule: IRuleNode;
}

// TODO: Use similar functions already developed
function substitute(quad: RDF.Quad, map:  Record<string, RDF.Term>): RDF.Quad {
  return mapTerms(quad, (term) => {
    if (term.termType === 'Variable' && term.value in map) {
      return map[term.value];
    }
    return term;
  });
}

function maybeSubstitute({ rule: { rule, next }, index }: { rule: IRuleNode, index: number }, quad: RDF.Quad): IRuleNode | null {
  // console.log('running maybe substitution for', quad)
  
  
  let mapping: Record<string, RDF.Term> | null = {};
  const pattern = rule.premise[index];

  forEachTerms(pattern, (term, name) => {
    if (term.termType !== 'Variable') {
      // Verify that it is a valid match
      if (!term.equals(quad[name])) {
        mapping = null;
      return;
      }
    }

    if (mapping) {
      if (term.value in mapping) {
        if (!quad[name].equals(mapping[term.value])) {
          mapping = null;
        }
      } else {
        mapping[term.value] = quad[name];
      }
    }
  });

  if (mapping === null) {
    // console.log('returning null')
    return null;
  }

  const premise: RDF.Quad[] = [];

  for (let i = 0; i < rule.premise.length; i++) {
    if (i !== index) {
      premise.push(substitute(rule.premise[i], mapping));
    }
  }

  const conclusion = rule.conclusion && rule.conclusion.map(conclusion => substitute(conclusion, mapping!));

  const res: IRuleNode = {
    rule: {
      // TODO: See if we can just use the existing rule type
      ruleType: 'rdfs',
      premise,
      conclusion
    },
    next
  }

  // console.log('returning res', res, JSON.stringify(res.rule, null, 2))

  return res;
}

/**
 * A comunica Forward Chaining RDF Reason Actor.
 */
export class ActorRdfReasonForwardChaining extends ActorRdfReasonMediated {
  mediatorRuleEvaluate: MediatorRuleEvaluate;
  mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;

  public constructor(args: IActorRdfReasonForwardChainingArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    return true; // TODO implement
  }

  private async insert(context: IActionContext, results: AsyncIterator<RDF.Quad>): Promise<AsyncIterator<RDF.Quad>> {
    // console.log('existing dat', (<any> (context.get<IReasonGroup>(KeysRdfReason.data)?.dataset))?.getQuads())
    
    const { execute } = await this.mediatorRdfUpdateQuadsInfo.mediate({
      context, quadStreamInsert: results, filterSource: true
    });
    let { quadStreamInsert } = await execute();

    const x = await quadStreamInsert?.toArray()

    // console.log('inserted ', x, console.log((<any> (context.get<IReasonGroup>(KeysRdfReason.data)?.dataset))?.getQuads()));

    quadStreamInsert = x ? new ArrayIterator<RDF.Quad>(x, { autoStart: false }) : undefined;

    return quadStreamInsert ?? new ArrayIterator<RDF.Quad>([], { autoStart: false });
  }

  // This should probably be a mediator of its own
  private async evaluateInsert(rule: IRuleNode, context: IActionContext): Promise<AsyncIterator<RDF.Quad>> {
    const { results } = await this.mediatorRuleEvaluate.mediate({ rule: rule.rule, context });
    const x = await results.toArray();
    // console.log('results from ', rule, x);
    return this.insert(context, fromArray(x));
  }

  private evaluateInsertRule(rule: IRuleNode, context: IActionContext): IConsequenceData {
    const quads: AsyncIterator<RDF.Quad> = new WrappingIterator(this.evaluateInsert(rule, context));
    return { quads, rule };
  }

  private async fullyEvaluateRules(_rule: IRuleNode[], context: IActionContext): Promise<void> {
    // On the first evaluation of the rules we only need to apply reasoning with respect to the base source
    // NOTE: This particular function should *not* be used for reasoning after some implicit results have already
    // been materialized
    let results: AsyncIterator<IConsequenceData> | null = fromArray(_rule).map(rule => this.evaluateInsertRule(rule, context));

    const resarray = await results.toArray();
    // console.log('results array', resarray)

    results = fromArray(resarray);

    // For the remainder of the reasoning we then need to evaluate new rules that emerge with respect to the union of
    // sources
    const unionContext = setUnionSource(context);

    // console.log('------ Start ---------')
    while ((results = await maybeIterator(results)) !== null) {
      // console.log('iter 1 of results')
      // results = await this.insert(context, fromArray([ quad(namedNode('?s'), namedNode('?p'), namedNode('?o')) ]))
      
      
      // results = new EmptyIterator()
      
      results = new UnionIterator(results.map(({ quads, rule }) => {
        let newRules = new UnionIterator(quads.map(quad => fromArray(rule.next).map(rule => maybeSubstitute(rule, quad) || false)), { autoStart: false })
        // TODO: Remove this line once https://github.com/RubenVerborgh/AsyncIterator/pull/59 is merged - use null
        // TODO: Work out why errors are being suppressed - such as store not being in the context
          .filter((rule): rule is IRuleNode => rule !== false)
        
        return newRules.map(rule => this.evaluateInsertRule(rule, unionContext));
      }), { autoStart: false });


      const asArr: IConsequenceData[] = await results.toArray();
      // console.log(asArr);
      results = fromArray(asArr);
    }
    // console.log('------- END --------')
  }

  public async execute({ rules, context }: IActionRdfReasonExecute): Promise<void> {
    // TODO: Refactor this - I've already written something similar somewhere
    const nodes: IRuleNode[] = rules.map(rule => ({ rule, next: [] }));
    
    // Creating rule dependencies
    for (const n1 of nodes) {
      for (const n2 of nodes) {

        if (n1.rule.conclusion === false) {
          continue;
        }

        for (const conclusion of n1.rule.conclusion) {

          for (let i = 0; i < n2.rule.premise.length; i++) {
            const pattern = n2.rule.premise[i];
            if (matchPatternMappings(conclusion, pattern)) {
              n1.next.push({ rule: n2, index: i });
            }
          }

        }
      }
    }

    // TODO: Context manipulations to set the correct destination
    // there is also likely a problem around the fact that we need the
    // base to be the union for everything except the first iteration (when it just needs to be the sources) - we need
    // to make sure that this is handled properly

    // Set the destination to the implicit dataset for reasoning
    // console.log(nodes, nodes[0], nodes[0].next)
    return this.fullyEvaluateRules(nodes, setImplicitDestination(context));
  }
}

export interface IActorRdfReasonForwardChainingArgs extends IActorRdfReasonMediatedArgs {
  mediatorRuleEvaluate: MediatorRuleEvaluate;
  mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;
}
