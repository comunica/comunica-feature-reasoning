import type { IActorArgs, IActorTest } from '@comunica/core';
import type { IActionRuleDereference, IActorRuleDereferenceOutput } from './ActorRuleDereference';
import { ActorRuleDereference } from './ActorRuleDereference';

// TODO: Long term create a generic bus-dereference which bus-rdf-dereference and bus-rule-dereference use.

/**
 * A base actor for dereferencing URLs to rule streams.
 *
 * Actor types:
 * * Input:  IActionRuleDereference:      A URL.
 * * Test:   <none>
 * * Output: IActorRuleDereferenceOutput: A rule stream.
 *
 * @see IActionRuleDereference
 * @see IActorRuleDereferenceOutput
 */
export abstract class ActorRuleDereferenceMediaMappings extends ActorRuleDereference {
  public readonly mediaMappings: Record<string, string>;

  public constructor(args: IActorRuleDereferenceMediaMappingsArgs) {
    super(args);
  }

  /**
   * Get the media type based on the extension of the given path,
   * which can be an URL or file path.
   * @param {string} path A path.
   * @return {string} A media type or the empty string.
   */
  public getMediaTypeFromExtension(path: string): string {
    const dotIndex = path.lastIndexOf('.');
    if (dotIndex >= 0) {
      const ext = path.slice(dotIndex);
      // Ignore dot
      console.log(this.mediaMappings)
      // TODO: FIX CONFIGS SO THIS IS DEFIENE
      return this.mediaMappings?.[ext.slice(1)] || '';
    }
    return '';
  }
}

export interface IActorRuleDereferenceMediaMappingsArgs
  extends IActorArgs<IActionRuleDereference, IActorTest, IActorRuleDereferenceOutput> {
  /**
   * A collection of mappings, mapping file extensions to their corresponding media type.
   */
  mediaMappings: Record<string, string>;
}
