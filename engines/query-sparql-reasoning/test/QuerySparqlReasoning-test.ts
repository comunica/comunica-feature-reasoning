/** @jest-environment setup-polly-jest/jest-environment-node */

// Needed to undo automock from actor-http-native, cleaner workarounds do not appear to be working.
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { Store } from 'n3';
import { DataFactory } from 'rdf-data-factory';
import { QueryEngine } from '../lib/QueryEngine';
import { mockHttp } from './util';

jest.unmock('follow-redirects');

const DF = new DataFactory();

describe('System test: QuerySparqlReasoning', () => {
  const pollyContext = mockHttp();

  let engine: QueryEngine;

  beforeEach(() => {
    engine = new QueryEngine();
    pollyContext.polly.server.any().on('beforePersist', (req: any, recording: any) => {
      recording.request.headers = recording.request.headers.filter(({ name }: any) => name !== 'user-agent');
    });
  });

  afterEach(async() => {
    await pollyContext.polly.flush();
  });

  describe('query', () => {
    describe('simple SPO', () => {
      it('should return a single triple', async() => {
        const result = await engine.queryBindings('SELECT * WHERE { ?s ?p ?o }', {
          [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
          // eslint-disable-next-line max-len
          [KeysRdfReason.rules.name]: 'https://gist.githubusercontent.com/jeswr/e914df85df0b3d39cfc42f462770ed87/raw/ffd9f5bd6638d8db3d57d2cf4f96e6d003328ac5/rdfs.hylar',
          sources: [ new Store([
            DF.quad(
              DF.namedNode('http://example.org/s'),
              DF.namedNode('http://example.org/p'),
              DF.namedNode('http://example.org/o'),
            ),
          ]) ],
        });
        expect((await result.toArray()).length).toEqual(15);
      });
    });
  });
});
