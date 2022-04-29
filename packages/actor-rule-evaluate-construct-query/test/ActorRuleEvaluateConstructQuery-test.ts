import { BindingsFactory } from '@comunica/bindings-factory';
import { MediatorQueryOperation, IActionQueryOperation, } from '@comunica/bus-query-operation';
import { ActionContext, Bus } from '@comunica/core';
import { SingletonIterator, ArrayIterator, empty } from 'asynciterator';
import { DataFactory } from 'rdf-data-factory';
import { ActorRuleEvaluateConstructQuery } from '../lib/ActorRuleEvaluateConstructQuery';
import { IQueryOperationResultQuads } from '@comunica/types';
import { Algebra } from 'sparqlalgebrajs';

const DF = new DataFactory();
const BF = new BindingsFactory();

describe('ActorRuleEvaluateConstructQuery', () => {
  let bus: any;
  let context: ActionContext;
  let mediatorQueryOperation: MediatorQueryOperation;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRuleEvaluateConstructQuery instance', () => {
    let actor: ActorRuleEvaluateConstructQuery;

    beforeEach(() => {
      // @ts-ignore
      mediatorQueryOperation = {
        async mediate(args: IActionQueryOperation): Promise<IQueryOperationResultQuads> {
          console.log(args)
          const patterns: Algebra.Pattern[] = args.operation.template;
          return {
            type: 'quads',
            metadata: async () => ({
              cardinality: {
                type: 'exact',
                value: patterns.length,
              },
              canContainUndefs: false,
              availableOrders: undefined,
              order: undefined,
              patterns: args.operation.input.patterns
            }),
            quadStream: new ArrayIterator(
              patterns.map(p => DF.quad(
                DF.namedNode(p.subject.value),
                DF.namedNode(p.predicate.value),
                DF.namedNode(p.object.value),
              ))
            , { autoStart: false })
          }
        }
      };
      actor = new ActorRuleEvaluateConstructQuery({ name: 'actor', bus, mediatorQueryOperation });
      context = new ActionContext();
    });

    it('should test true on valid rule types', () => {
      expect(actor.test({
        context,
        rule: { ruleType: 'premise-conclusion', premise: [], conclusion: [] }
      })).resolves.toBeTruthy();

      expect(actor.test({
        context,
        rule: { ruleType: 'rdfs', premise: [], conclusion: [] }
      })).resolves.toBeTruthy();

      expect(actor.test({
        context,
        rule: { ruleType: 'nested-premise-conclusion', premise: [], conclusion: [] }
      })).resolves.toBeTruthy();
    });

    it('should error on invalid rule types', () => {
      expect(() => actor.test({
        context,
        // @ts-expect-error This is a bad rule type
        rule: { ruleType: 'bad-rule', premise: [], conclusion: [] }
      })).rejects.toThrow();
    });

    it('should error on existing bindings', () => {
      expect(() => actor.test({
        context,
        rule: { ruleType: 'rdfs', premise: [], conclusion: [] },
        quadStream: empty()
      })).rejects.toThrow();
    });

    it('should run with empty premise and conclusion', async () => {
      const results = await actor.run({
        context,
        rule: { ruleType: 'premise-conclusion', premise: [], conclusion: [] }
      });
      expect(await results.results.toArray()).toEqual([]);
    });

    it('should run with empty premise and conclusion', async () => {
      const results = await actor.run({
        context,
        rule: { 
          ruleType: 'premise-conclusion',
          premise: [],
          conclusion: [
            DF.quad(DF.variable('?s'), DF.variable('?p'), DF.variable('?o'))
          ] 
        }
      });
      expect(await results.results.toArray()).toEqual([
        DF.quad(DF.namedNode('?s'), DF.namedNode('?p'), DF.namedNode('?o'))
      ]);
    });

    it('should run with empty premise and false conclusion', async () => {
      const results = await actor.run({
        context,
        rule: { 
          ruleType: 'rdfs',
          premise: [],
          conclusion: false
        }
      });
      expect(await results.results.toArray()).toEqual([]);
    });

    it('should run with premise and conclusion', async () => {
      const results = await actor.run({
        context,
        rule: { 
          ruleType: 'premise-conclusion',
          premise: [
            DF.quad(DF.variable('?s'), DF.variable('?p'), DF.variable('?o'))
          ],
          conclusion: [
            DF.quad(DF.variable('?s'), DF.variable('?p'), DF.variable('?o'))
          ] 
        }
      });
      expect(await results.results.toArray()).toEqual([DF.quad(DF.namedNode('?s'), DF.namedNode('?p'), DF.namedNode('?o'))]);
    });
  });
});
