import { ActorRuleEvaluateRestriction } from '@comunica/actor-rule-evaluate-restriction';
import { mediatorRdfResolveQuadPattern } from './mediatorRdfResolveQuadPattern';
import { createMediator } from './util';

export const mediatorRuleEvaluate = createMediator(ActorRuleEvaluateRestriction, { mediatorRdfResolveQuadPattern });
