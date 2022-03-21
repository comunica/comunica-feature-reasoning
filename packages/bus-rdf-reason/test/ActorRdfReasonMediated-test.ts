import { MediatorOptimizeRule } from "@comunica/bus-optimize-rule";
import { IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput, MediatorRdfResolveQuadPattern } from "@comunica/bus-rdf-resolve-quad-pattern";
import { IActionRdfUpdateQuads, IActorRdfUpdateQuadsOutput, MediatorRdfUpdateQuads } from "@comunica/bus-rdf-update-quads";
import { IActorRuleResolveOutput, MediatorRuleResolve } from "@comunica/bus-rule-resolve";
import { KeysRdfUpdateQuads, KeysRdfResolveQuadPattern } from "@comunica/context-entries";
import { ActionContext, Actor, Bus, IActorTest } from "@comunica/core";
import { Rule } from "@comunica/reasoning-types";
import { quad, namedNode } from "@rdfjs/data-model";
import { UnionIterator, wrap, fromArray } from "asynciterator";
import { promisifyEventEmitter } from "event-emitter-promisify";
import { Store } from "n3";
import { ActorRdfReasonRuleRestriction } from "../../actor-rdf-reason-rule-restriction/lib/ActorRdfReasonRuleRestriction";
import { IActionRdfReason, IActorRdfReasonOutput, implicitGroupFactory, IReasonGroup, KeysRdfReason } from "../lib/ActorRdfReason";
import { actorParams, mediators } from '@comunica/reasoning-mocks'
import 'jest-rdf';

describe('ActorRdfReasonRuleRestriction', () => {
  let bus: Bus<Actor<IActionRdfReason, IActorTest, IActorRdfReasonOutput>, IActionRdfReason, IActorTest, IActorRdfReasonOutput>;
  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfReasonRuleRestriction instance', () => {
    let actor: ActorRdfReasonRuleRestriction;
    let action: IActionRdfReason;
    let data: IReasonGroup;
    let destination: Store;
    let source: Store;

    beforeEach(() => {
      actor = new ActorRdfReasonRuleRestriction({
        name: 'actor',
        bus,
        ...mediators
      });

      data = implicitGroupFactory(
        new ActionContext({
          [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
        }),
      );

      destination = new Store();

      source = new Store();

      action = {
        context: new ActionContext({
          [KeysRdfReason.data.name]: data,
          [KeysRdfReason.rules.name]: 'my-unnested-rules',
          [KeysRdfUpdateQuads.destination.name]: destination,
          [KeysRdfResolveQuadPattern.source.name]: source,
        }),
      };
    });

    

  });
});
