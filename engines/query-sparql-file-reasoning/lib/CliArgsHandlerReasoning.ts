import { KeysRdfReason, KeysRdfDereferenceConstantHylar } from '@comunica/reasoning-context-entries';
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
          describe: `The rules to reason with; select ${Object.keys(KeysRdfDereferenceConstantHylar).join(', ')} or provide a deferencerable URL`,

          default: 'rdfs',
          group: 'Required options:',
        },
      });
  }

  public async handleArgs(args: Record<string, any>, context: Record<string, any>): Promise<void> {
    if (args.rules && typeof args.rules === 'string') {
      for (const [ key, value ] of Object.entries(KeysRdfDereferenceConstantHylar)) {
        if (key === args.rules.toLowerCase()) {
          context[KeysRdfReason.rules.name] = value;
          return;
        }
      }
    }

    context[KeysRdfReason.rules.name] = args.rules;
  }
}
