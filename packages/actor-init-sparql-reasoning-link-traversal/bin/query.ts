#!/usr/bin/env node
// Tslint:disable:no-var-requires
import { KeysRdfReason } from '@comunica/bus-rdf-reason';
import { ActionContext } from '@comunica/core';
import { runArgsInProcessStatic } from '@comunica/runner-cli';
// RunArgsInProcessStatic(require('../engine-default.js'));

runArgsInProcessStatic(require('../engine-default.js'), { context: ActionContext({
  // [KeysRdfReason.rules]: 'https://bit.ly/subclass-hylar'
  // [KeysRdfReason.rules]: 'https://gist.githubusercontent.com/jeswr/e914df85df0b3d39cfc42f462770ed87/raw/1460e12f875ee48791f25a06dadf9b52c6edc8bb/hylar',
  [KeysRdfReason.rules]: 'https://bit.ly/owl2rl-hylar',
}) });
