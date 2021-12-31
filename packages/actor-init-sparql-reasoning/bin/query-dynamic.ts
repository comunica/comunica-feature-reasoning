#!/usr/bin/env node
import { runArgsInProcess } from '@comunica/runner-cli';
import { KeysRdfReason } from '@comunica/bus-rdf-reason';
import { ActionContext } from '@comunica/core';
import { defaultGraph, namedNode, quad, variable } from '@rdfjs/data-model';

runArgsInProcess(`${__dirname}/../`, `${__dirname}/../config/config-default.json`, { context: ActionContext({
  [KeysRdfReason.rules]: [
    {
      premise: [
        quad(
          variable('?s'),
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          variable('?o'),
          defaultGraph()
        ),
        quad(
          variable('?o'),
          namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
          variable('?o2'),
          defaultGraph()
        ),
      ],
      conclusion: [
        quad(
          variable('?s'),
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          variable('?o2'),
          defaultGraph()
        ),
      ]
    },
  ]
})});
