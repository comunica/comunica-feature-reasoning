import { ActionContext, Bus } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import { fromArray } from 'asynciterator';
import { DataFactory } from 'n3';
import { Factory } from 'sparqlalgebrajs';
import { ActorOptimizeRulePatternRestriction } from '../lib/ActorOptimizeRulePatternRestriction';

const DF = DataFactory;
const factory = new Factory();

describe('ActorOptimizeRulePatternRestriction', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorOptimizeRulePatternRestriction instance', () => {
    let actor: ActorOptimizeRulePatternRestriction;

    beforeEach(() => {
      actor = new ActorOptimizeRulePatternRestriction({ name: 'actor', bus });
    });

    it('should throw an error if no pattern is present', () => {
      return expect(actor.test({ context: new ActionContext(), rules: fromArray([]) })).rejects.toThrowError();
    });

    it('should not throw an error if pattern is present and rules are valid', () => {
      return expect(actor.test({ context: new ActionContext(),
        rules: fromArray([]),
        pattern: factory.createPattern(
          DF.variable('x'),
          DF.variable('x'),
          DF.variable('x'),
        ) })).resolves.toBeTruthy();
    });

    it('should not throw an error if all variables are distinct', () => {
      return expect(actor.test({ context: new ActionContext(),
        rules: fromArray([]),
        pattern: factory.createPattern(
          DF.variable('s'),
          DF.variable('p'),
          DF.variable('o'),
          DF.variable('g'),
        ) })).rejects.toThrowError();
    });

    it('should be true if there is at least one namedNode in the pattern', () => {
      return expect(actor.test({ context: new ActionContext(),
        rules: fromArray([]),
        pattern: factory.createPattern(
          DF.variable('s'),
          DF.namedNode('p'),
          DF.variable('o'),
          DF.variable('g'),
        ) })).resolves.toBeTruthy();
    });

    it('should run', async() => {
      const { rules } = await actor.run({ context: new ActionContext(),
        rules: fromArray<Rule>([
          {
            ruleType: 'premise-conclusion',
            premise: [],
            conclusion: [],
          },
        ]) });
      expect(await rules.toArray()).toEqual([]);
    });

    it('should remove a single rule that does not match the pattern', async() => {
      const { rules } = await actor.run({ context: new ActionContext(),
        rules: fromArray<Rule>([
          {
            ruleType: 'premise-conclusion',
            premise: [],
            conclusion: [ DF.quad(
              DF.namedNode('a'),
              DF.namedNode('b'),
              DF.namedNode('c'),
            ) ],
          },
        ]),
        pattern: factory.createPattern(
          DF.variable('x'),
          DF.variable('x'),
          DF.variable('x'),
        ) });
      expect(await rules.toArray()).toEqual([]);
    });

    it('should keep a single rule that does match the pattern', async() => {
      const { rules } = await actor.run({ context: new ActionContext(),
        rules: fromArray<Rule>([
          {
            ruleType: 'premise-conclusion',
            premise: [],
            conclusion: [ DF.quad(
              DF.namedNode('a'),
              DF.namedNode('a'),
              DF.namedNode('a'),
            ) ],
          },
        ]),
        pattern: factory.createPattern(
          DF.variable('x'),
          DF.variable('x'),
          DF.variable('x'),
        ) });
      expect(await rules.toArray()).toEqual([{
        ruleType: 'premise-conclusion',
        premise: [],
        conclusion: [ DF.quad(
          DF.namedNode('a'),
          DF.namedNode('a'),
          DF.namedNode('a'),
        ) ],
      }]);
    });

    it('should keep a single rule that does match the pattern (variables and namednodes)', async() => {
      const { rules } = await actor.run({ context: new ActionContext(),
        rules: fromArray<Rule>([
          {
            ruleType: 'premise-conclusion',
            premise: [],
            conclusion: [ DF.quad(
              DF.variable('x'),
              DF.namedNode('a'),
              DF.variable('y'),
            ) ],
          },
        ]),
        pattern: factory.createPattern(
          DF.variable('x'),
          DF.variable('x'),
          DF.variable('x'),
        ) });
      expect(await rules.toArray()).toEqual([{
        ruleType: 'premise-conclusion',
        premise: [],
        conclusion: [ DF.quad(
          DF.variable('x'),
          DF.namedNode('a'),
          DF.variable('y'),
        ) ],
      }]);
    });

    it('should keep a single rule that does match another premise', async() => {
      const { rules } = await actor.run({ context: new ActionContext(),
        rules: fromArray<Rule>([
          {
            ruleType: 'premise-conclusion',
            premise: [ DF.quad(
              DF.namedNode('s'),
              DF.namedNode('p'),
              DF.namedNode('o'),
            ) ],
            conclusion: [ DF.quad(
              DF.variable('x'),
              DF.namedNode('a'),
              DF.variable('y'),
            ) ],
          },
          {
            ruleType: 'premise-conclusion',
            premise: [ DF.quad(
              DF.namedNode('f'),
              DF.namedNode('n'),
              DF.namedNode('t'),
            ) ],
            conclusion: [ DF.quad(
              DF.namedNode('s'),
              DF.namedNode('p'),
              DF.namedNode('o'),
            ) ],
          },
        ]),
        pattern: factory.createPattern(
          DF.variable('x'),
          DF.variable('x'),
          DF.variable('x'),
        ) });
      expect(await rules.toArray()).toHaveLength(2);
    });

    it('should work with default graph rule', async() => {
      const { rules } = await actor.run({ context: new ActionContext(),
        rules: fromArray<Rule>([
          {
            ruleType: 'premise-conclusion',
            premise: [ DF.quad(
              DF.variable('s'),
              DF.namedNode('a'),
              DF.variable('o'),
              DF.defaultGraph(),
            ), DF.quad(
              DF.variable('o'),
              DF.namedNode('subClassOf'),
              DF.variable('o2'),
              DF.defaultGraph(),
            ) ],
            conclusion: [ DF.quad(
              DF.variable('s'),
              DF.namedNode('a'),
              DF.variable('o2'),
              DF.defaultGraph(),
            ) ],
          },
        ]),
        pattern: factory.createPattern(
          DF.variable('s'),
          DF.variable('p'),
          DF.variable('o'),
          DF.variable('g'),
        ) });
      expect(await rules.toArray()).toHaveLength(1);
    });

    it('should work with default graph rule and using restricted pattern', async() => {
      const { rules } = await actor.run({ context: new ActionContext(),
        rules: fromArray<Rule>([
          {
            ruleType: 'premise-conclusion',
            premise: [ DF.quad(
              DF.variable('s'),
              DF.namedNode('a'),
              DF.variable('o'),
              DF.defaultGraph(),
            ), DF.quad(
              DF.variable('o'),
              DF.namedNode('subClassOf'),
              DF.variable('o2'),
              DF.defaultGraph(),
            ) ],
            conclusion: [ DF.quad(
              DF.variable('s'),
              DF.namedNode('a'),
              DF.variable('o2'),
              DF.defaultGraph(),
            ) ],
          },
        ]),
        pattern: factory.createPattern(
          DF.namedNode('Jesse'),
          DF.namedNode('a'),
          DF.variable('o'),
          DF.variable('g'),
        ) });
      expect(await rules.toArray()).toHaveLength(1);
    });
  });
});
