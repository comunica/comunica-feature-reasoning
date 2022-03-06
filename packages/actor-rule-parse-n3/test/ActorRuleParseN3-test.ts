// Import { ActorRuleParse } from '@comunica/bus-rule-parse';
import type { IActionRdfParse, IActorRdfParseOutput } from '@comunica/bus-rdf-parse';
import { Bus } from '@comunica/core';
import type { Rule } from '@comunica/reasoning-types';
import { quad, namedNode, variable } from '@rdfjs/data-model';
import arrayifyStream from 'arrayify-stream';
import { StreamParser } from 'n3';
import stringToStream = require('streamify-string');
import { ActorRuleParseN3 } from '../lib/ActorRuleParseN3';
// @ts-expect-error
import 'jest-rdf';
import exp = require('constants');

const rule1 = `
@prefix : <dpe#>.

{:b :re ?X} => {:c :not_re ?X}.
`;

const rule1Equivalent = `
@prefix : <dpe#>.

{:c :not_re ?X} <= {:b :re ?X}.
`;

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
`;
describe('ActorRuleParseN3', () => {
  let bus: any;
  let mediatorRdfParse: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRuleParseN3 instance', () => {
    let actor: ActorRuleParseN3;

    beforeEach(() => {
      mediatorRdfParse = {
        async mediate(action: IActionRdfParse): Promise<IActorRdfParseOutput> {
          const parser = new StreamParser({
            baseIRI: action.baseIRI,
            format: 'text/n3',
          });

          return {
            data: parser.import(action.data),
          };
        },
        async mediateActor(action: IActionRdfParse) {

        },
      };
      actor = new ActorRuleParseN3({
        name: 'actor',
        bus,
        mediatorRdfParse,
      });
    });

    // TODO: IMPLEMENT THIS
    it('should test', () => {
      expect(actor.test({
        input: stringToStream(rule1),
        baseIRI: 'http://example.org#',
      })).resolves.toEqual(true);

      expect(actor.test({
        input: stringToStream(rule2),
        baseIRI: 'http://example.org#',
      })).resolves.toEqual(true);
    });

    it('should run', async() => {
      const { rules } = await actor.run({
        input: stringToStream(rule1),
        baseIRI: 'http://example.org#',
      });

      const arr = await arrayifyStream(rules);

      expect(arr).toHaveLength(1);

      const rule: Rule = arr[0];

      expect(rule.premise).toEqualRdfQuadArray([
        quad(
          namedNode('http://dpe#b'),
          namedNode('http://dpe#re'),
          variable('X'),
        ),
      ]);

      expect(rule.conclusion).toEqualRdfQuadArray([
        quad(
          namedNode('http://dpe#c'),
          namedNode('http://dpe#not_re'),
          variable('X'),
        ),
      ]);
    });
  });
});
