// Import { ActorRuleParse } from '@comunica/bus-rule-parse';
import * as fs from 'fs';
import type { IActionAbstractMediaTyped } from '@comunica/actor-abstract-mediatyped';
import type { IActionRdfParseHandle, IActorOutputRdfParseHandle, IActorTestRdfParseHandle, MediatorRdfParseHandle } from '@comunica/bus-rdf-parse';
import type { IActionRuleParse, IActorRuleParseOutput } from '@comunica/bus-rule-parse';
import type { Actor, IActorReply } from '@comunica/core';
import { ActionContext, Bus } from '@comunica/core';
import type { IPremiseConclusionRule } from '@comunica/reasoning-types';
import { namedNode, quad, variable } from '@rdfjs/data-model';
// Import streamifyString from 'arrayify-stream';
import arrayifyStream from 'arrayify-stream';
import 'jest-rdf';
import { StreamParser } from 'n3';
import * as path from 'path';
import streamifyString = require('streamify-string');
import { ActorRuleParseN3 } from '../lib/ActorRuleParseN3';
import { mediatorRdfParse } from '@comunica/reasoning-mocks'

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

function createAction(file: string, isFile = true): IActionRuleParse {
  return {
    data: isFile ? fs.createReadStream(path.join(__dirname, 'data', `${file}.hylar`)) : streamifyString(file),
    metadata: { baseIRI: 'http://example.org#' },
    context: new ActionContext(),
  };
}

function createMediaTypedAction(file: string, isFile = true): IActionAbstractMediaTyped<IActionRuleParse> {
  return {
    handle: createAction(file, isFile),
    context: new ActionContext(),
  };
}

describe('ActorRuleParseN3', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRuleParseN3 instance', () => {
    let actor: ActorRuleParseN3;

    beforeEach(() => {
      actor = new ActorRuleParseN3({
        name: 'actor',
        bus,
        mediatorRdfParse,
        mediaTypeFormats: {},
        mediaTypePriorities: {},
      });
    });

    // TODO: IMPLEMENT THIS
    it('should test', () => {
      expect(actor.test(createMediaTypedAction(rule1, false))).resolves.toEqual({ handle: []});

      expect(actor.test(createMediaTypedAction(rule2, false))).resolves.toEqual({ handle: []});
    });

    it('should run', async() => {
      const { data } = <IActorRuleParseOutput> (<any> await actor.run(createMediaTypedAction(rule1, false))).handle;

      const arr = await arrayifyStream(data);

      expect(arr).toHaveLength(1);

      const rule: IPremiseConclusionRule = arr[0];

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
