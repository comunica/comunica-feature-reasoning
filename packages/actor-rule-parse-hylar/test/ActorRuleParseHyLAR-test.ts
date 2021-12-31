import { ActorRuleParse, IActorRuleParseOutput, Rule, IActionRuleParse } from '@comunica/bus-rule-parse';
import { Bus } from '@comunica/core';
import { quad, variable, namedNode } from '@rdfjs/data-model'
import { ActorRuleParseHyLAR } from '../lib/ActorRuleParseHyLAR';
import * as fs from 'fs';
import * as path from 'path';
// const streamifyString = require('streamify-string')
const arrayifyStream = require('stream-to-array')
import "jest-rdf";

function createAction(file: string): IActionRuleParse {
  return { input: fs.createReadStream(path.join(__dirname, 'data', `${file}.hylar`)) }
}

describe('ActorRuleParseHyLAR', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRuleParseHyLAR instance', () => {
    let actor: ActorRuleParseHyLAR;

    beforeEach(() => {
      actor = new ActorRuleParseHyLAR({ name: 'actor', bus });
    });

    it('should test', async () => {
      // console.log(JSON.stringify(await arrayifyStream((await actor.run(createAction('owl2rl'))).rules)))
      expect(await actor.test(createAction('owl2rl'))).toEqual(true);
      expect(await actor.test(createAction('rdfs'))).toEqual(true);
      // expect(await actor.test(createAction('invalid1'))).toEqual(false);
      // expect(await actor.test(createAction('invalid2'))).toEqual(false);
      // expect(await actor.test(createAction('invalid3'))).toEqual(false);
    });

    // it('should run', async () => {
    //   const rules: Rule[] = await arrayifyStream((await actor.run({ input: streamifyString('(?uuu ?aaa ?yyy) -> (?aaa rdf:type rdf:Property)') })).rules);
    //   expect(rules).toHaveLength(1);
    //   expect(rules[0]).toMatchObject<Rule>({
    //     premise: [
    //       quad(variable('uuu'), variable('aaa'), variable('yyy')),
    //     ],
    //     conclusion: [
    //       quad(variable('aaa'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), variable('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property')),
    //     ]
    //   });
    // });
  });
});
