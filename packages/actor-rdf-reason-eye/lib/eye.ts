import SWIPLModule from 'swipl-wasm';
import { EYE_PL } from './eye-pl';
import { BufferedIterator, AsyncIterator, wrap } from 'asynciterator';
import { Writer, Parser } from 'n3';
import * as RDF from '@rdfjs/types';

async function queryEye(data: string, query: string, cb: (str: string) => void) {
  const M = await SWIPLModule({ printErr: () => {}, print: cb });
  M.FS.writeFile('eye.pl', EYE_PL);
  M.FS.writeFile('query.n3', query);
  M.FS.writeFile('data.n3', data);

  for (const _ of M.prolog.query("consult('eye.pl')"));
  for (const _ of M.prolog.query("main(['--quiet', './data.n3', '--query', './query.n3'])."));
}

export class EyeIterator extends BufferedIterator<string> {
  constructor(data: string, query: string) {
    super();
    queryEye(data, query, str => { this._push(str) })
      .then(() => { this.close(); })
  }
}

export async function getEyeIteratorUnwrapped(data: AsyncIterator<RDF.Quad>, query: string) {
  return new EyeIterator(new Writer().quadsToString(await data.toArray()), query);
}

export function getEyeIterator(data: AsyncIterator<RDF.Quad>, query: string) {
  return wrap(getEyeIteratorUnwrapped(data, query));
}

export async function getEyeIteratorParsed(data: AsyncIterator<RDF.Quad>, query: string): Promise<RDF.Quad[]> {
  const parser = new Parser();
  return parser.parse((await (await getEyeIteratorUnwrapped(data, query)).toArray()).join(''))
}
