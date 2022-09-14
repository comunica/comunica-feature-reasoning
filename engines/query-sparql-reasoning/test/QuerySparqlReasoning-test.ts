/** @jest-environment setup-polly-jest/jest-environment-node */

// Needed to undo automock from actor-http-native, cleaner workarounds do not appear to be working.
import { KeysRdfDereferenceConstantHylar, KeysRdfReason } from '@comunica/reasoning-context-entries';
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
      it('rdfs rules on timbl and foaf', async() => {
        const result = await engine.queryBindings(
          'SELECT DISTINCT * WHERE { <https://www.w3.org/People/Berners-Lee/card#i> a ?o }', {
            [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),

            [KeysRdfReason.rules.name]: KeysRdfDereferenceConstantHylar.rdfs,
            sources: [
              'https://www.w3.org/People/Berners-Lee/card',
              // 'http://xmlns.com/foaf/spec/index.rdf',
              'https://web.archive.org/web/20220614105937if_/http://xmlns.com/foaf/spec/20140114.rdf',
            ],
          },
        );
        expect((await result.toArray()).map(x => x.get('o')?.value).sort()).toEqual([
          'http://www.w3.org/2000/10/swap/pim/contact#Male',
          'http://www.w3.org/2000/01/rdf-schema#Resource',
          'http://xmlns.com/foaf/0.1/Person',
          'http://xmlns.com/foaf/0.1/Agent',
          'http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing',
          'http://www.w3.org/2002/07/owl#Thing',
        ].sort());
      });
      it('owl2rl on timbl and foaf', async() => {
        const result = await engine.queryBindings(
          'SELECT DISTINCT * WHERE { <https://www.w3.org/People/Berners-Lee/card#i> a ?o }', {
            [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),

            [KeysRdfReason.rules.name]: KeysRdfDereferenceConstantHylar.owl2rl,
            sources: [
              'https://www.w3.org/People/Berners-Lee/card',
              // 'http://xmlns.com/foaf/spec/index.rdf',
              'https://web.archive.org/web/20220614105937if_/http://xmlns.com/foaf/spec/20140114.rdf',
            ],
          },
        );
        expect((await result.toArray()).map(x => x.get('o')?.value).sort()).toEqual([
          'http://purl.org/dc/terms/Agent',
          'http://schema.org/Person',
          'http://www.w3.org/2000/10/swap/pim/contact#Male',
          'http://www.w3.org/2000/10/swap/pim/contact#Person',
          'http://www.w3.org/2002/07/owl#Thing',
          'http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing',
          'http://xmlns.com/foaf/0.1/Agent',
          'http://xmlns.com/foaf/0.1/Person',
        ].sort());
      });

      it('owl2rl on timbl and foaf - using rules shortcut', async() => {
        const result = await engine.queryBindings(
          'SELECT DISTINCT * WHERE { <https://www.w3.org/People/Berners-Lee/card#i> a ?o }', {
            [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
            rules: KeysRdfDereferenceConstantHylar.owl2rl,
            sources: [
              'https://www.w3.org/People/Berners-Lee/card',
              // 'http://xmlns.com/foaf/spec/index.rdf',
              'https://web.archive.org/web/20220614105937if_/http://xmlns.com/foaf/spec/20140114.rdf',
            ],
          },
        );
        expect((await result.toArray()).map(x => x.get('o')?.value).sort()).toEqual([
          'http://purl.org/dc/terms/Agent',
          'http://schema.org/Person',
          'http://www.w3.org/2000/10/swap/pim/contact#Male',
          'http://www.w3.org/2000/10/swap/pim/contact#Person',
          'http://www.w3.org/2002/07/owl#Thing',
          'http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing',
          'http://xmlns.com/foaf/0.1/Agent',
          'http://xmlns.com/foaf/0.1/Person',
        ].sort());
      });

      it('owl2rl on timbl and foaf - using rules shortcut and no implicit dataset factory', async() => {
        const result = await engine.queryBindings(
          'SELECT DISTINCT * WHERE { <https://www.w3.org/People/Berners-Lee/card#i> a ?o }', {
            rules: KeysRdfDereferenceConstantHylar.owl2rl,
            sources: [
              'https://www.w3.org/People/Berners-Lee/card',
              // 'http://xmlns.com/foaf/spec/index.rdf',
              'https://web.archive.org/web/20220614105937if_/http://xmlns.com/foaf/spec/20140114.rdf',
            ],
          },
        );
        expect((await result.toArray()).map(x => x.get('o')?.value).sort()).toEqual([
          'http://purl.org/dc/terms/Agent',
          'http://schema.org/Person',
          'http://www.w3.org/2000/10/swap/pim/contact#Male',
          'http://www.w3.org/2000/10/swap/pim/contact#Person',
          'http://www.w3.org/2002/07/owl#Thing',
          'http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing',
          'http://xmlns.com/foaf/0.1/Agent',
          'http://xmlns.com/foaf/0.1/Person',
        ].sort());
      });
    });
  });
});
