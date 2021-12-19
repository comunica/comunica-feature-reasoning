// import { ActorRuleParse } from '@comunica/bus-rule-parse';
import { ActorRuleParse, IActionRuleParse, IActorRuleParseOutput, Rule } from '@comunica/bus-rule-parse';
import { Bus } from '@comunica/core';
import { fromArray } from 'asynciterator';
import { ActorRuleParseN3, streamToArray } from '../lib/ActorRuleParseN3';
import { quad, namedNode, blankNode, variable } from '@rdfjs/data-model'
// @ts-ignore
import stringToStream = require('streamify-string');
import arrayifyStream = require('arrayify-stream');
import 'jest-rdf'

// jest.addMatchers(require('jest-rdf'))

const rule1 = `
@prefix : <dpe#>.

{:b :re ?X} => {:c :not_re ?X}.
`

const rule1Equivalent = `
@prefix : <dpe#>.

{:c :not_re ?X} <= {:b :re ?X}.
`

const rule2 = `
@prefix list: <http://www.w3.org/2000/10/swap/list#>.
@prefix e: <http://eulersharp.sourceforge.net/2003/03swap/log-rules#>.
@prefix : <http://josd.github.io/brain/4color#>.

{() :places true} <= true.

{?PLACES :places true} <= {
    ?PLACES e:firstRest ((?PLACE ?COLOR) ?TAIL).
    ?TAIL :places true.
    ?PLACE :neighbours ?NEIGHBOURS.
    (:red :green :blue :yellow) list:member ?COLOR.
    ?SCOPE e:fail {
        ?TAIL list:member (?NEIGHBOUR ?COLOR).
        ?NEIGHBOURS list:member ?NEIGHBOUR.
    }.
}.
`


describe('ActorRuleParseN3', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRuleParseN3 instance', () => {
    let actor: ActorRuleParseN3;

    beforeEach(() => {
      actor = new ActorRuleParseN3({ name: 'actor', bus });
    });

    // TODO: IMPLEMENT THIS
    it('should test', () => {
      expect(actor.test({ 
        input: stringToStream(rule1)
      })).resolves.toEqual(true);

      expect(actor.test({ 
        input: stringToStream(rule2)
      })).resolves.toEqual(true);
    });

    it('should run', async () => {
      const { rules } = await actor.run({
        input: stringToStream(rule1)
       })

       const arr = await arrayifyStream(rules);

       expect(arr).toHaveLength(1);
       console.log('rule array is', arr)

       const rule: Rule = arr[0]
       expect(rule).toBeTruthy()
       if (rule === null) {
          return;
       }
       
       const { premise, conclusion } = rule;
       console.log(premise, conclusion)
       expect(conclusion).toBeInstanceOf(Array);
       if (conclusion === false) {
         return;
       }

       expect(premise).toHaveLength(1)
       expect(conclusion).toHaveLength(1)

       expect(conclusion).toEqualRdfTermArray([
        quad(
          namedNode('dpe#c'),
          namedNode('dpe#not_re'),
          variable('X'),
         )
       ]);

       expect(rule.equals(new Rule([
        quad(
          namedNode('dpe#b'),
          namedNode('dpe#re'),
          variable('X'),
         )
       ],[
        quad(
          namedNode('dpe#c'),
          namedNode('dpe#not_re'),
          variable('X'),
         )
       ]))).toBeTruthy()

      //  expect(true).to
    });
  });
});
