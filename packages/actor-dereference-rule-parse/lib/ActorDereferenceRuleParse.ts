import type { IActorDereferenceOutput } from '@comunica/bus-dereference';
import type { IActorDereferenceRuleArgs } from '@comunica/bus-dereference-rule';
import { ActorDereferenceRule } from '@comunica/bus-dereference-rule';
import type { IActionRuleParseMetadata } from '@comunica/bus-rule-parse';

/**
 * A comunica Parse Dereference Rule Actor.
 */
export class ActorDereferenceRuleParse extends ActorDereferenceRule {
  public constructor(args: IActorDereferenceRuleArgs) {
    super(args);
  }

  public async getMetadata(dereference: IActorDereferenceOutput): Promise<IActionRuleParseMetadata> {
    return { baseIRI: dereference.url };
  }
}

export interface IActorDereferenceRuleParseArgs extends IActorDereferenceRuleArgs {
  /**
   * A collection of mappings, mapping file extensions to their corresponding media type.
   * @range {json}
   * @default {{
   * "hylar":    "text/plain",
   * "ttl":      "text/turtle",
   * "turtle":   "text/turtle",
   * "nt":       "application/n-triples",
   * "ntriples": "application/n-triples",
   * "nq":       "application/n-quads",
   * "nquads":   "application/n-quads",
   * "rdf":      "application/rdf+xml",
   * "rdfxml":   "application/rdf+xml",
   * "owl":      "application/rdf+xml",
   * "n3":       "text/n3",
   * "trig":     "application/trig",
   * "jsonld":   "application/ld+json",
   * "json":     "application/json",
   * "html":     "text/html",
   * "htm":      "text/html",
   * "xhtml":    "application/xhtml+xml",
   * "xht":      "application/xhtml+xml",
   * "xml":      "application/xml",
   * "svg":      "image/svg+xml",
   * "svgz":     "image/svg+xml"
   * }}
   */
  mediaMappings: Record<string, string>;
}