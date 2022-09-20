/** @jest-environment setup-polly-jest/jest-environment-node */

// Needed to undo automock from actor-http-native, cleaner workarounds do not appear to be working.
import * as path from 'path';
import { KeysRdfDereferenceConstantHylar, KeysRdfReason } from '@comunica/reasoning-context-entries';
import { Store } from 'n3';
import { DataFactory } from 'rdf-data-factory';
import { QueryEngine } from '../lib/QueryEngine';
import { mockHttp } from './util';

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
          [KeysRdfReason.rules.name]: path.join(__dirname, './data/empty-rule.hylar'),
          sources: [ new Store([
            DF.quad(
              DF.namedNode('http://example.org/s'),
              DF.namedNode('http://example.org/p'),
              DF.namedNode('http://example.org/o'),
            ),
          ]) ],
        });
        expect(await result.toArray()).toHaveLength(1);
      });

      it('should return a single triple with empty rule serialised in n3', async() => {
        const result = await engine.queryBindings('SELECT * WHERE { ?s ?p ?o }', {
          [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
          [KeysRdfReason.rules.name]: path.join(__dirname, './data/empty-rule.n3'),
          sources: [ new Store([
            DF.quad(
              DF.namedNode('http://example.org/s'),
              DF.namedNode('http://example.org/p'),
              DF.namedNode('http://example.org/o'),
            ),
          ]) ],
        });
        expect(await result.toArray()).toHaveLength(1);
      });

      it('should correctly apply subclasses', async() => {
        const result = await engine.queryBindings('SELECT * WHERE { <http://example.org/Jesse> a ?o }', {
          [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
          [KeysRdfReason.rules.name]: path.join(__dirname, './data/subclass-rule.hylar'),
          sources: [ new Store([
            DF.quad(
              DF.namedNode('http://example.org/Person'),
              DF.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
              DF.namedNode('http://example.org/Thing'),
            ),
            DF.quad(
              DF.namedNode('http://example.org/Jesse'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('http://example.org/Person'),
            ),
          ]) ],
        });
        expect(await result.toArray()).toHaveLength(2);
      });

      it('should correctly apply subclasses with subclass rule serialised in n3', async() => {
        const result = await engine.queryBindings('SELECT * WHERE { <http://example.org/Jesse> a ?o }', {
          [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
          [KeysRdfReason.rules.name]: path.join(__dirname, './data/subclass-rule.n3'),
          sources: [ new Store([
            DF.quad(
              DF.namedNode('http://example.org/Person'),
              DF.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
              DF.namedNode('http://example.org/Thing'),
            ),
            DF.quad(
              DF.namedNode('http://example.org/Jesse'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('http://example.org/Person'),
            ),
          ]) ],
        });
        expect(await result.toArray()).toHaveLength(2);
      });

      it('should correctly apply subclasses with subclass rule serialised in n3 - using rules shortcut', async() => {
        const result = await engine.queryBindings('SELECT * WHERE { <http://example.org/Jesse> a ?o }', {
          [KeysRdfReason.implicitDatasetFactory.name]: () => new Store(),
          rules: path.join(__dirname, './data/subclass-rule.n3'),
          sources: [ new Store([
            DF.quad(
              DF.namedNode('http://example.org/Person'),
              DF.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
              DF.namedNode('http://example.org/Thing'),
            ),
            DF.quad(
              DF.namedNode('http://example.org/Jesse'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('http://example.org/Person'),
            ),
          ]) ],
        });
        expect(await result.toArray()).toHaveLength(2);
      });

      it(`should correctly apply subclasses with subclass rule serialised in n3 -
          using rules shortcut and no implicit dataset factory`, async() => {
        const result = await engine.queryBindings('SELECT * WHERE { <http://example.org/Jesse> a ?o }', {
          rules: path.join(__dirname, './data/subclass-rule.n3'),
          sources: [ new Store([
            DF.quad(
              DF.namedNode('http://example.org/Person'),
              DF.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
              DF.namedNode('http://example.org/Thing'),
            ),
            DF.quad(
              DF.namedNode('http://example.org/Jesse'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('http://example.org/Person'),
            ),
          ]) ],
        });
        expect(await result.toArray()).toHaveLength(2);
      });

      // TODO: Name properly - we are testing concurrent query handling
      it(`should correctly apply subproperty rules in owl2rl`, async() => {
        const result2 = engine.queryBindings('SELECT * WHERE { <https://id.inrupt.com/jeswr> <http://example.org/parent> ?o }', {
          rules: KeysRdfDereferenceConstantHylar.owl2rl,
          sources: [
            path.join(__dirname, 'data', 'jeswr.ttl')
          ],
        });

        const result = await engine.queryBindings('SELECT * WHERE { <https://id.inrupt.com/jeswr> <http://example.org/ancestor> ?o }', {
          rules: KeysRdfDereferenceConstantHylar.owl2rl,
          sources: [
            path.join(__dirname, 'data', 'jeswr.ttl')
          ],
        });

        const res = await result.toArray();
        expect(res).toHaveLength(1);
        expect(res[0].get('o')).toEqual(DF.namedNode('https://id.inrupt.com/jeswr_sr'));

        const res2 = await (await result2).toArray();
        expect(res2).toHaveLength(1);
        expect(res[0].get('o')).toEqual(DF.namedNode('https://id.inrupt.com/jeswr_sr'));

      });
    });
  });
});
