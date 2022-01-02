import * as fs from 'fs';
import { URL } from 'url';
import { promisify } from 'util';
import type { IActionRuleDereference, IActorRuleDereferenceOutput, IActorRuleDereferenceMediaMappingsArgs } from '@comunica/bus-rule-dereference';
import { ActorRuleDereferenceMediaMappings } from '@comunica/bus-rule-dereference';
import type { IActionHandleRuleParse, IActorOutputHandleRuleParse, IActorRuleParseOutput, IActorTestHandleRuleParse } from '@comunica/bus-rule-parse';
import type { IActorTest, Mediator, Actor } from '@comunica/core';

/**
 * A comunica Actor for dereferencing file paths into streams of Rules
 */
export class ActorRuleDereferenceFile extends ActorRuleDereferenceMediaMappings {
  public readonly mediatorRuleParse: Mediator<
  Actor<IActionHandleRuleParse, IActorTestHandleRuleParse, IActorOutputHandleRuleParse>,
  IActionHandleRuleParse, IActorTestHandleRuleParse, IActorOutputHandleRuleParse>;

  public constructor(args: IActorRuleDereferenceFileArgs) {
    super(args);
  }

  public async test(action: IActionRuleDereference): Promise<IActorTest> {
    try {
      await promisify(fs.access)(
        action.url.startsWith('file://') ? new URL(action.url) : action.url, fs.constants.F_OK,
      );
    } catch (error: unknown) {
      throw new Error(
        `This actor only works on existing local files. (${error})`,
      );
    }
    return true;
  }

  public async run(action: IActionRuleDereference): Promise<IActorRuleDereferenceOutput> {
    let { mediaType } = action;

    // Deduce media type from file extension if possible
    if (!mediaType) {
      mediaType = this.getMediaTypeFromExtension(action.url);
    }

    const parseAction: IActionHandleRuleParse = {
      context: action.context,
      handle: {
        baseIRI: action.url,
        input: fs.createReadStream(action.url.startsWith('file://') ? new URL(action.url) : action.url),
      },
    };
    if (mediaType) {
      parseAction.handleMediaType = mediaType;
    }

    let parseOutput: IActorRuleParseOutput;
    try {
      parseOutput = (await this.mediatorRuleParse.mediate(parseAction)).handle;
    } catch (error: unknown) {
      return this.handleDereferenceError(action, error);
    }

    return {
      headers: {},
      rules: this.handleDereferenceStreamErrors(action, parseOutput.rules),
      exists: true,
      url: action.url,
    };
  }
}

export interface IActorRuleDereferenceFileArgs extends IActorRuleDereferenceMediaMappingsArgs {
  /**
   * Mediator used for parsing the file contents.
   */
  mediatorRuleParse: Mediator<
  Actor<IActionHandleRuleParse, IActorTestHandleRuleParse, IActorOutputHandleRuleParse>,
  IActionHandleRuleParse, IActorTestHandleRuleParse, IActorOutputHandleRuleParse>;
}
