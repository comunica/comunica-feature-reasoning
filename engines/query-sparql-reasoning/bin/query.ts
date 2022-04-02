#!/usr/bin/env node

import { KeysInitQuery } from '@comunica/context-entries';
import { ActionContext } from '@comunica/core';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { runArgsInProcessStatic } from '@comunica/runner-cli';
import { Store } from 'n3';
import { CliArgsHandlerReasoning } from '../lib/CliArgsHandlerReasoning';

const cliArgsHandlerReasoning = new CliArgsHandlerReasoning();

runArgsInProcessStatic(require('../engine-default.js'), {
  context: new ActionContext({
    [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
    [KeysInitQuery.cliArgsHandlers.name]: [ cliArgsHandlerReasoning ],
  }),
});
