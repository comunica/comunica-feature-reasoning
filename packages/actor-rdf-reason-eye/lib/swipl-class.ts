import { EYE_PL } from './eye-pl';
import { BufferedIterator } from 'asynciterator';
const SWIPL = require('./swipl-web');

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

class EyeIterator extends BufferedIterator<string> {
  constructor(data: string, query: string) {
    super();
    const Module = {
      noInitialRun: true,
      arguments: [],
      locateFile: function(file: any) {
      return './' + file;
      },
      print: (str: string) => {
        // console.log('this is', this)
        this._push(str)
      },
      printErr: (line: any) => {
        // this.emit('error', line)
    },
    } as any;

    SWIPL(Module).then(() => {
      Module.FS.writeFile('eye.pl', EYE_PL);
      Module.prolog.call_string("consult('eye.pl').");

      Module.FS.writeFile('data.n3', data);
      Module.FS.writeFile('query.n3', query);
      Module.prolog.call_string("main(['--quiet', './data.n3', '--query', './query.n3']).")
    })
    // Module.prolog.call_string("consult('eye.pl').");
  }
}

// NOTE: Enable this to run a quick test
// const iterator = new EyeIterator(SOCH, SOCH_QUERY);
// iterator.on('data', (d) => {
//   console.log(d)
// })
// iterator.on('end', (d) => {
//   console.log('end')
// })
// iterator.on('error', (d) => {
//   console.log('--------');
//   console.log('error', d);
//   console.log('--------');
// })