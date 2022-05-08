import { mediatorDereferenceRule } from './mediatorDereferenceRule';
import { mediatorOptimizeRule } from './mediatorOptimizeRule';
import { mediatorRdfParse } from './mediatorRdfParse';
import { mediatorRdfReason } from './mediatorRdfReason';
import { mediatorRdfResolveQuadPattern } from './mediatorRdfResolveQuadPattern';
import { mediatorRdfUpdateQuads } from './mediatorRdfUpdateQuads';
import { mediatorRuleResolve } from './mediatorRuleResolve';
import { mediatorRuleEvaluate } from './mediatorRuleEvaluate';

export {
  mediatorOptimizeRule,
  mediatorRdfResolveQuadPattern,
  mediatorRdfReason,
  mediatorRdfUpdateQuads,
  mediatorRuleResolve,
  mediatorRdfParse,
  mediatorDereferenceRule,
  mediatorRuleEvaluate
};

export const mediators = {
  mediatorOptimizeRule,
  mediatorRdfResolveQuadPattern,
  mediatorRdfReason,
  mediatorRdfUpdateQuads,
  mediatorRuleResolve,
  mediatorRdfParse,
  mediatorDereferenceRule,
  mediatorRuleEvaluate
};
