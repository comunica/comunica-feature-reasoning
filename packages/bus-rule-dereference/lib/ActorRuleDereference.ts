import { Readable, EventEmitter, PassThrough } from 'stream';
import { Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediator } from '@comunica/core';
import * as RDF from '@rdfjs/types';
import { KeysInitSparql } from '@comunica/context-entries'

/**
 * An actor for dereferencing a path or URL into a stream of Rules.
 *
 * Actor types:
 * * Input:  IActionRuleDereference:      A file path or URL.
 * * Test:   <none>
 * * Output: IActorRuleDereferenceOutput: A Rule stream.
 *
 * @see IActionRuleDereference
 * @see IActorRuleDereferenceOutput
 */
export abstract class ActorRuleDereference extends Actor<IActionRuleDereference, IActorTest, IActorRuleDereferenceOutput> {
  public constructor(args: IActorArgs<IActionRuleDereference, IActorTest, IActorRuleDereferenceOutput>) {
    super(args);
  }

  /**
   * Check if hard errors should occur on HTTP or parse errors.
   * @param {IActionRuleDereference} action An RDF dereference action.
   * @return {boolean} If hard errors are enabled.
   */
   protected isHardError(action: IActionRuleDereference): boolean {
    return !action.context || !action.context.get(KeysInitSparql.lenient);
  }

  /**
   * If hard errors are disabled, modify the given stream so that errors are delegated to the logger.
   * @param {IActionRuleDereference} action An RDF dereference action.
   * @param {Stream} rules A rule stream.
   * @return {Stream} The resulting rule stream.
   */
  protected handleDereferenceStreamErrors(action: IActionRuleDereference,
    rules: Stream<Rule> & Readable): Stream<Rule> & Readable {
    // If we don't emit hard errors, make parsing error events log instead, and silence them downstream.
    if (!this.isHardError(action)) {
      rules.on('error', error => {
        this.logError(action.context, error.message, () => ({ url: action.url }));
        // Make sure the errored stream is ended.
        (<any> rules).push(null);
      });
      rules = (<any> rules).pipe(new PassThrough({ objectMode: true }));
    }
    return rules;
  }

  /**
   * Handle the given error as a rejection or delegate it to the logger,
   * depending on whether or not hard errors are enabled.
   * @param {IActionRuleDereference} action A Rule dereference action.
   * @param {Error} error An error that has occurred.
   * @param headers Optional HTTP headers to pass.
   * @return {Promise<IActionRuleDereference>} A promise that rejects or resolves to an empty output.
   */
  protected async handleDereferenceError(
    action: IActionRuleDereference,
    error: unknown,
    headers?: Record<string, string>,
  ): Promise<IActorRuleDereferenceOutput> {
    if (this.isHardError(action)) {
      throw error;
    } else {
      this.logError(action.context, (<Error> error).message);
      const rules = new Readable();
      rules.push(null);
      return { url: action.url, rules, exists: false, headers };
    }
  }
}


export type MediatorRuleDereference = Mediator<Actor<IActionRuleDereference, IActorTest,
  IActorRuleDereferenceOutput>, IActionRuleDereference, IActorTest, IActorRuleDereferenceOutput>;

// export type MediatorRuleDereference = Mediator<Actor<IActionRuleDereference, 

export interface IActionRuleDereference extends IAction {
  /**
   * The URL to dereference
   */
   url: string;

   /**
    * By default, actors will reject upon receiving non-200 HTTP responses.
    * If this option is true, then all HTTP responses will cause the action to resolve,
    * but some outputs may therefore contain empty quad streams.
    */
   acceptErrors?: boolean;
 
   /**
    * The mediatype of the source (if it can't be inferred from the source)
    */
   mediaType?: string;

   /**
    * Optional HTTP method to use.
    * Defaults to GET.
    */
   method?: string;

   /**
    * Optional HTTP headers to pass.
    */
   headers?: Record<string, string>;
}

export interface IActorRuleDereferenceOutput extends IActorOutput {
  /**
   * The page on which the output was found.
   *
   * This is not necessarily the same as the original input url,
   * as this may have changed due to redirects.
   */
   url: string;
   /**
    * The resulting quad stream.
    */
   rules: Stream<Rule> & Readable;
   /**
    * This will always be true, unless `acceptErrors` was set to true in the action and the dereferencing failed.
    */
   exists: boolean;
   /**
    * The returned headers of the final URL.
    */
   headers?: Record<string, string>;
}

// TODO: CHECK BELOW

enum KeysInitSparqlReasoning {
  lenient = "lenient"
}

interface Rule {
  premise: RDF.Quad[];
  conclusion: RDF.Quad[] | false;
}

/**
 * A quad stream.
 * This stream is only readable, not writable.
 *
 * Events:
 * * `readable()`:           When a quad can be read from the stream, it will emit this event.
 * * `end()`:                This event fires when there will be no more quads to read.
 * * `error(error: Error)`:  This event fires if any error occurs. The `message` describes the error.
 * * `data(quad: RDF.Quad)`: This event is emitted for every quad that can be read from the stream.
 *                           The quad is the content of the data.
 * Optional events:
 * * prefix(prefix: string, iri: RDF.NamedNode): This event is emitted every time a prefix is mapped to some IRI.
 */
 export interface Stream<Q> extends EventEmitter {
  /**
   * This method pulls a quad out of the internal buffer and returns it.
   * If there is no quad available, then it will return null.
   *
   * @return A quad from the internal buffer, or null if none is available.
   */
  read(): Q | null;
}
