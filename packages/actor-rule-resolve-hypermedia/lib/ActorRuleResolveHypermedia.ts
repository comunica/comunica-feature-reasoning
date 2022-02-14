import LRUCache = require('lru-cache');
import { ActorRuleResolve } from '@comunica/bus-rule-resolve';
import { MediatorDereferenceRdf } from '@comunica/bus-dereference-rule';

/**
 * A comunica Hypermedia Rule Resolve Actor.
 */
 export class ActorRuleResolveHypermedia extends ActorRuleResolve
 implements IActorRdfResolveQuadPatternHypermediaArgs {
 public readonly mediatorDereferenceRule: MediatorDereferenceRule;
 public readonly mediatorMetadata: MediatorRdfMetadata;
 public readonly mediatorMetadataExtract: MediatorRdfMetadataExtract;
 public readonly mediatorRdfResolveHypermedia: MediatorRdfResolveHypermedia;
 public readonly mediatorRdfResolveHypermediaLinks: MediatorRdfResolveHypermediaLinks;
 public readonly mediatorRdfResolveHypermediaLinksQueue: MediatorRdfResolveHypermediaLinksQueue;
 public readonly cacheSize: number;
 public readonly cache?: LRUCache<string, MediatedQuadSource>;
 public readonly httpInvalidator: ActorHttpInvalidateListenable;

 public constructor(args: IActorRdfResolveQuadPatternHypermediaArgs) {
   super(args);
   this.cache = this.cacheSize ? new LRUCache<string, any>({ max: this.cacheSize }) : undefined;
   const cache = this.cache;
   if (cache) {
     this.httpInvalidator.addInvalidateListener(
       ({ url }: IActionHttpInvalidate) => url ? cache.del(url) : cache.reset(),
     );
   }
 }

 public async test(action: IActionRdfResolveQuadPattern): Promise<IActorTest> {
   const sources = hasContextSingleSource(action.context);
   if (!sources) {
     throw new Error(`Actor ${this.name} can only resolve quad pattern queries against a single source.`);
   }
   return true;
 }

 protected getSource(context: IActionContext, operation: Algebra.Pattern): Promise<IQuadSource> {
   const contextSource = getContextSource(context)!;
   const url = getContextSourceUrl(contextSource)!;
   let source: MediatedQuadSource;

   // Try to read from cache
   if (this.cache && this.cache.has(url)) {
     source = this.cache.get(url)!;
   } else {
     // If not in cache, create a new source
     source = new MediatedQuadSource(this.cacheSize, context, url, getDataSourceType(contextSource), {
       mediatorMetadata: this.mediatorMetadata,
       mediatorMetadataExtract: this.mediatorMetadataExtract,
       mediatorDereferenceRdf: this.mediatorDereferenceRdf,
       mediatorRdfResolveHypermedia: this.mediatorRdfResolveHypermedia,
       mediatorRdfResolveHypermediaLinks: this.mediatorRdfResolveHypermediaLinks,
       mediatorRdfResolveHypermediaLinksQueue: this.mediatorRdfResolveHypermediaLinksQueue,
     });

     // Set in cache
     if (this.cache) {
       this.cache.set(url, source);
     }
   }

   return Promise.resolve(source);
 }
}