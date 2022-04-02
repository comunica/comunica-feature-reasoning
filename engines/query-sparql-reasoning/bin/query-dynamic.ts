#!/usr/bin/env node
import { KeysInitQuery } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { runArgsInProcess } from '@comunica/runner-cli';
import { Store } from 'n3';
import { CliArgsHandlerReasoning } from '../lib/CliArgsHandlerReasoning';

const cliArgsHandlerReasoning = new CliArgsHandlerReasoning();

runArgsInProcess(`${__dirname}/../`, `${__dirname}/../config/config-default.json`, {
  context: new ActionContext({
    [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
    [KeysInitQuery.cliArgsHandlers.name]: [ cliArgsHandlerReasoning ],
  }),
});
