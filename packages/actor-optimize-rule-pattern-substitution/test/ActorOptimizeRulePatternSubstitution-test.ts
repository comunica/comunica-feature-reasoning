import { ActorOptimizeRule } from '@comunica/bus-optimize-rule';
import { Bus } from '@comunica/core';
import { defaultGraph, namedNode, quad, variable } from '@rdfjs/data-model';
import { ActorOptimizeRulePatternSubstitution } from '../lib/ActorOptimizeRulePatternSubstitution';

describe('ActorOptimizeRulePatternSubstitution', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorOptimizeRulePatternSubstitution instance', () => {
    let actor: ActorOptimizeRulePatternSubstitution;

    beforeEach(() => {
      actor = new ActorOptimizeRulePatternSubstitution({ name: 'actor', bus });
    });

    // it('should test', () => {
    //   return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    // });

    const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'

    it('should run', () => {
      return expect(actor.run({ rules: [
        {
          premise: [quad(
            variable("?u"),
            variable("?a"),
            variable("?y"),
            defaultGraph()
          )],
          conclusion: [
            quad(
              variable("?u"),
              namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
              namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"),
              defaultGraph()
            )
          ]
        },
        {
          premise: [quad(
            variable("?a"),
            namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#domain"),
            variable("?x"),
            defaultGraph()
          ),quad(
            variable("?u"),
            variable("?a"),
            variable("?y"),
            defaultGraph()
          )],
          conclusion: [
            quad(
              variable("?u"),
              namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
              variable("?x"),
              defaultGraph()
            )
          ]
        },
        {
          premise: [quad(
            variable("?a"),
            namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#range"),
            variable("?x"),
            defaultGraph()
          ),quad(
            variable("?u"),
            variable("?a"),
            variable("?y"),
            defaultGraph()
          )],
          conclusion: [
            quad(
              variable("?y"),
              namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
              variable("?x"),
              defaultGraph()
            )
          ]
        },
        {
          premise: [quad(
            variable("?u"),
            variable("?a"),
            variable("?y"),
            defaultGraph()
          )],
          conclusion: [
            quad(
              variable("?y"),
              namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
              variable("?x"),
              defaultGraph()
            )
          ]
        }
      ] })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
