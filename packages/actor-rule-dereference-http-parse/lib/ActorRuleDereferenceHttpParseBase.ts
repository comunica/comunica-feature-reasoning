import { Readable } from 'stream';
import type { IActionHttp, IActorHttpOutput } from '@comunica/bus-http';
import { ActorHttp } from '@comunica/bus-http';
import type { IActionRuleDereference,
  IActorRuleDereferenceMediaMappingsArgs,
  IActorRuleDereferenceOutput } from '@comunica/bus-rule-dereference';
import {
  ActorRuleDereferenceMediaMappings,
} from '@comunica/bus-rule-dereference';
import type {
  IActionHandleRuleParse,
  IActionMediaTypesRuleParse,
  IActionRuleParse,
  IActorOutputHandleRuleParse,
  IActorOutputMediaTypesRuleParse,
  IActorRuleParseOutput,
  IActorTestHandleRuleParse,
  IActorTestMediaTypesRuleParse,
} from '@comunica/bus-rule-parse';
import type { Actor, IActorTest, Mediator } from '@comunica/core';
import { Headers } from 'cross-fetch';
import { resolve as resolveRelative } from 'relative-to-absolute-iri';
import * as stringifyStream from 'stream-to-string';

/**
 * An actor that listens on the 'Rule-dereference' bus.
 *
 * It starts by grabbing all available Rule media types from the Rule parse bus.
 * After that, it resolves the URL using the HTTP bus using an accept header compiled from the available media types.
 * Finally, the response is parsed using the Rule parse bus.
 */
export abstract class ActorRuleDereferenceHttpParseBase extends ActorRuleDereferenceMediaMappings
  implements IActorRuleDereferenceHttpParseArgs {
  public static readonly REGEX_MEDIATYPE: RegExp = /^[^ ;]*/u;

  public readonly mediatorHttp: Mediator<Actor<IActionHttp, IActorTest, IActorHttpOutput>,
  IActionHttp, IActorTest, IActorHttpOutput>;

  public readonly mediatorRuleParseMediatypes: Mediator<
  Actor<IActionMediaTypesRuleParse, IActorTestMediaTypesRuleParse, IActorOutputMediaTypesRuleParse>,
  IActionMediaTypesRuleParse, IActorTestMediaTypesRuleParse, IActorOutputMediaTypesRuleParse>;

  public readonly mediatorRuleParseHandle: Mediator<
  Actor<IActionHandleRuleParse, IActorTestHandleRuleParse, IActorOutputHandleRuleParse>,
  IActionHandleRuleParse, IActorTestHandleRuleParse, IActorOutputHandleRuleParse>;

  public readonly maxAcceptHeaderLength: number;
  public readonly maxAcceptHeaderLengthBrowser: number;

  public constructor(args: IActorRuleDereferenceHttpParseArgs) {
    super(args);
  }

  public async test(action: IActionRuleDereference): Promise<IActorTest> {
    if (!/^https?:/u.test(action.url)) {
      throw new Error(`Cannot retrieve ${action.url} because it is not an HTTP(S) URL.`);
    }
    return true;
  }

  public async run(action: IActionRuleDereference): Promise<IActorRuleDereferenceOutput> {
    // console.log('run called on http parse')
    let exists = true;

    // Define accept header based on available media types.
    const { mediaTypes } = await this.mediatorRuleParseMediatypes.mediate(
      { context: action.context, mediaTypes: true },
    );
    const acceptHeader: string = this.mediaTypesToAcceptString(mediaTypes, this.getMaxAcceptHeaderLength());

    // Resolve HTTP URL using appropriate accept header
    const headers: Headers = new Headers({ Accept: acceptHeader });

    // Append any custom passed headers
    for (const key in action.headers) {
      headers.append(key, action.headers[key]);
    }

    const httpAction: IActionHttp = {
      context: action.context,
      init: { headers, method: action.method },
      input: action.url,
    };
    let httpResponse: IActorHttpOutput;
    try {
      httpResponse = await this.mediatorHttp.mediate(httpAction);
    } catch (error: unknown) {
      return this.handleDereferenceError(action, error);
    }
    // The response URL can be relative to the given URL
    const url = resolveRelative(httpResponse.url, action.url);

    // Convert output headers to a hash
    const outputHeaders: Record<string, string> = {};
    // eslint-disable-next-line no-return-assign
    httpResponse.headers.forEach((value, key) => outputHeaders[key] = value);

    // Only parse if retrieval was successful
    if (httpResponse.status !== 200) {
      exists = false;
      // Consume the body, to avoid process to hang
      let bodyString = 'empty response';
      if (httpResponse.body) {
        const responseStream = ActorHttp.toNodeReadable(httpResponse.body);
        bodyString = await stringifyStream(responseStream);
      }
      if (!action.acceptErrors) {
        const error = new Error(`Could not retrieve ${action.url} (HTTP status ${httpResponse.status}):\n${bodyString}`);
        return this.handleDereferenceError(action, error, outputHeaders);
      }
    }

    // console.log('response body', httpResponse.body)

    // Create Node quad response stream;
    let responseStream: NodeJS.ReadableStream;
    if (exists) {
      // Wrap WhatWG readable stream into a Node.js readable stream
      // If the body already is a Node.js stream (in the case of node-fetch), don't do explicit conversion.
      responseStream = ActorHttp.toNodeReadable(httpResponse.body);
    } else {
      responseStream = new Readable();
      (<Readable> responseStream).push(null);
    }

    // console.log('node stream', responseStream, httpResponse.headers, action)

    // Parse the resulting response
    const match: RegExpExecArray = ActorRuleDereferenceHttpParseBase.REGEX_MEDIATYPE
      .exec(httpResponse.headers.get('content-type') ?? '')!;
    let mediaType: string | undefined = match[0];

    // console.log('------------------')

    // If no media type could be found, try to determine it via the file extension
    if (!mediaType || mediaType === 'text/plain') {
      mediaType = action.mediaType || this.getMediaTypeFromExtension(httpResponse.url);
    }

    const parseAction: IActionRuleParse = {
      baseIRI: url,
      headers: httpResponse.headers,
      input: responseStream,
    };

    // console.log('parseAction', parseAction)
    let parseOutput: IActorRuleParseOutput;
    try {
      parseOutput = (await this.mediatorRuleParseHandle.mediate(
        { context: action.context, handle: parseAction, handleMediaType: mediaType },
      )).handle;
    } catch (error: unknown) {
      // Close the body, to avoid process to hang
      await httpResponse.body!.cancel();
      return this.handleDereferenceError(action, error, outputHeaders);
    }

    const rules = this.handleDereferenceStreamErrors(action, parseOutput.rules);

    // Return the parsed quad stream and whether or not only triples are supported
    return { url, rules, exists, headers: outputHeaders };
  }

  public mediaTypesToAcceptString(mediaTypes: Record<string, number>, maxLength: number): string {
    const wildcard = '*/*;q=0.1';
    const parts: string[] = [];
    const sortedMediaTypes = Object.keys(mediaTypes)
      .map(mediaType => ({ mediaType, priority: mediaTypes[mediaType] }))
      .sort((left, right) => {
        if (right.priority === left.priority) {
          return left.mediaType.localeCompare(right.mediaType);
        }
        return right.priority - left.priority;
      });
    // Take into account the ',' characters joining each type
    const separatorLength = sortedMediaTypes.length - 1;
    let partsLength = separatorLength;
    for (const entry of sortedMediaTypes) {
      const part = entry.mediaType + (entry.priority !== 1 ?
        `;q=${entry.priority.toFixed(3).replace(/0*$/u, '')}` :
        '');
      if (partsLength + part.length > maxLength) {
        while (partsLength + wildcard.length > maxLength) {
          const last = parts.pop() || '';
          // Don't forget the ','
          partsLength -= last.length + 1;
        }
        parts.push(wildcard);
        break;
      }
      parts.push(part);
      partsLength += part.length;
    }
    if (parts.length === 0) {
      return '*/*';
    }
    return parts.join(',');
  }

  protected abstract getMaxAcceptHeaderLength(): number;
}

export interface IActorRuleDereferenceHttpParseArgs extends
  IActorRuleDereferenceMediaMappingsArgs {
  mediatorHttp: Mediator<Actor<IActionHttp, IActorTest, IActorHttpOutput>,
  IActionHttp, IActorTest, IActorHttpOutput>;
  mediatorRuleParseMediatypes: Mediator<
  Actor<IActionMediaTypesRuleParse, IActorTestMediaTypesRuleParse, IActorOutputMediaTypesRuleParse>,
  IActionMediaTypesRuleParse, IActorTestMediaTypesRuleParse, IActorOutputMediaTypesRuleParse>;
  mediatorRuleParseHandle: Mediator<
  Actor<IActionHandleRuleParse, IActorTestHandleRuleParse, IActorOutputHandleRuleParse>,
  IActionHandleRuleParse, IActorTestHandleRuleParse, IActorOutputHandleRuleParse>;
  maxAcceptHeaderLength: number;
  maxAcceptHeaderLengthBrowser: number;
}
