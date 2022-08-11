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
    print: (line: any) => console.log(line, 'stdout'),
    printErr: (line: any) => console.log(line, 'stderr'),
    // TODO: See if I need to do something here. For instance
    // to wait until everything is initialised
    // preRun: [() => bindStdin(Module)]
  }
  await require('./swipl-web.js')(Module);

  // TODO: Remove these
  // (Module as any).FS.writeFile('eye.pl', EYE_PL);
  // fs.writeFileSync(path.join(__dirname, './e.pl'), (await (await fetch('https://josd.github.io/eye/eye.pl')).text()).replaceAll('\\', '\\\\').replaceAll('`', '\\`'));
  // console.log('written')
  (Module as any).FS.writeFile('eye.pl', EYE_PL);
  // (Module as any).FS.writeFile('eye.pl', await (await fetch('https://josd.github.io/eye/eye.pl')).text());
  (Module as any).FS.writeFile('socrates.n3', SOCH);
  (Module as any).FS.writeFile('socrates-query.n3', SOCH_QUERY);
  return Module;
}

// main(['--wcache', 'http://josd.github.io/eye/reasoning/socrates', '.', 'http://josd.github.io/eye/reasoning/socrates/socrates.n3', '--query', 'http://josd.github.io/eye/reasoning/socrates/socrates-query.n3']).">

(async () => {
  const module = await getModule();
  console.log('module retrieved');
  (module as any).prolog.call_string("consult('eye.pl').");
  (module as any).prolog.call_string("main(['--wcache', 'http://josd.github.io/eye/reasoning/socrates', '.', 'http://josd.github.io/eye/reasoning/socrates/socrates.n3', '--query', 'http://josd.github.io/eye/reasoning/socrates/socrates-query.n3']).")
  // console.log(module);
})();



// console.log(require('./swipl-web.js'))