import { mediatorDereferenceRule } from './mediatorDereferenceRule';
import { mediatorOptimizeRule } from './mediatorOptimizeRule';
import { mediatorRdfParse } from './mediatorRdfParse';
import { mediatorRdfReason } from './mediatorRdfReason';
import { mediatorRdfResolveQuadPattern } from './mediatorRdfResolveQuadPattern';
import { mediatorRdfUpdateQuads } from './mediatorRdfUpdateQuads';
import { mediatorRdfUpdateQuadsInfo } from './mediatorRdfUpdateQuadsInfo';
import { mediatorRuleEvaluate } from './mediatorRuleEvaluate';
import { mediatorRuleResolve } from './mediatorRuleResolve';

export {
  mediatorOptimizeRule,
  mediatorRdfResolveQuadPattern,
  mediatorRdfReason,
  mediatorRdfUpdateQuads,
  mediatorRuleResolve,
  mediatorRdfParse,
  mediatorDereferenceRule,
  mediatorRuleEvaluate,
  mediatorRdfUpdateQuadsInfo,
};

export const mediators = {
  mediatorOptimizeRule,
  mediatorRdfResolveQuadPattern,
  mediatorRdfReason,
  mediatorRdfUpdateQuads,
  mediatorRuleResolve,
  mediatorRdfParse,
  mediatorDereferenceRule,
  mediatorRuleEvaluate,
  mediatorRdfUpdateQuadsInfo,
};
