import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import type { ICliArgsHandler } from '@comunica/types';
import type { Argv } from 'yargs';

/**
 * Adds and handles CLI options for Solid authentication.
 */
export class CliArgsHandlerReasoning implements ICliArgsHandler {
  public populateYargs(argumentsBuilder: Argv<any>): Argv<any> {
    return argumentsBuilder
      .options({
        rules: {
          alias: 'r',
          type: 'string',
          describe: 'The rules to reason with',
          // eslint-disable-next-line max-len
          default: 'https://gist.githubusercontent.com/jeswr/e914df85df0b3d39cfc42f462770ed87/raw/ffd9f5bd6638d8db3d57d2cf4f96e6d003328ac5/rdfs.hylar',
          group: 'Required options:',
        },
      });
  }

  public async handleArgs(args: Record<string, any>, context: Record<string, any>): Promise<void> {
    context[KeysRdfReason.rules.name] = args.rules;
  }
}
