import { EYE_PL } from './eye-pl';
import { BufferedIterator, AsyncIterator, wrap } from 'asynciterator';
import * as RDF from '@rdfjs/types';
import { Store, Parser, StreamParser, StreamWriter, Writer } from 'n3';
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

export class EyeIterator extends BufferedIterator<string> {
  constructor(data: { [key: string]: string }, query: string) {
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

      for (const key in data) {
        if (typeof key === 'string')
          Module.FS.writeFile('data.n3', data);
      }

      // Module.FS.writeFile('data.n3', data);
      Module.FS.writeFile('query.n3', query);
      Module.prolog.call_string("main(['--quiet', './data.n3', '--query', './query.n3']).")
    })
    // Module.prolog.call_string("consult('eye.pl').");
  }
}

// NOTE: Enable this to run a quick test
const iterator = new EyeIterator({ './data.n3': SOCH}, SOCH_QUERY);

export async function getEyeIteratorUnwrapped(data: { [key: string]: AsyncIterator<RDF.Quad> }, query: string) {
  // const parser = new Parser();
  // parser.parse
  // // parser.parse
  // const streamParser = new StreamParser();
  // streamParser.import
  const writer = new Writer();
  const newData: { [key: string]: string } = {};
  for (const key in data) {
    if (typeof key === 'string')
      newData[key] = writer.quadsToString(await data[key].toArray())
  };
  return new EyeIterator(newData, query);
}

export function getEyeIterator(data: { [key: string]: AsyncIterator<RDF.Quad> }, query: string) {
  return wrap(getEyeIteratorUnwrapped(data, query));
}


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
