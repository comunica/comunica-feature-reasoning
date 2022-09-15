import { EYE_PL } from './eye-pl';
import * as fs from 'fs';
import * as path from 'path';

const SOCH = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.

:Socrates a :Human.
:Human rdfs:subClassOf :Mortal.

{?A rdfs:subClassOf ?B. ?S a ?A} => {?S a ?B}.
`

const SOCH_QUERY = `
@prefix : <http://example.org/socrates#>.

{:Socrates a ?WHAT} => {:Socrates a ?WHAT}.`


async function getModule() {
  const Module = {
    noInitialRun: true,
    arguments: [],
    locateFile: function(file: any) {
    return './' + file;
    },
    print: console.log,
  }
  await require('./swipl-web.js')(Module);
  (Module as any).FS.writeFile('eye.pl', EYE_PL);
  (Module as any).FS.writeFile('socrates.n3', SOCH);
  (Module as any).FS.writeFile('socrates-query.n3', SOCH_QUERY);
  (Module as any).prolog.call_string("consult('eye.pl').");
  return Module;
}


(async () => {
  const module = await getModule();
  (module as any).prolog.call_string("main(['--quiet', '--wcache', 'http://josd.github.io/eye/reasoning/socrates', '.', 'http://josd.github.io/eye/reasoning/socrates/socrates.n3', '--query', 'http://josd.github.io/eye/reasoning/socrates/socrates-query.n3']).")
})();