import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { ActorRuleDereference } from '@comunica/bus-rule-dereference';
import { IActionHandleRuleParse, IActorOutputHandleRuleParse } from '@comunica/bus-rule-parse'
import { ActionContext, Bus } from '@comunica/core';
import { ActorRuleDereferenceFile } from '../lib/ActorRuleDereferenceFile';

const arrayifyStream = require('arrayify-stream');

function fileUrl(str: string): string {
  let pathName = path.resolve(str).replace(/\\/gu, '/');

  // Windows drive letter must be prefixed with a slash
  if (!pathName.startsWith('/')) {
    pathName = `/${pathName}`;
  }

  return encodeURI(`file://${pathName}`);
}


describe('ActorRuleDereferenceFile', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRuleDereferenceFile module', () => {
    it('should be a function', () => {
      expect(ActorRuleDereferenceFile).toBeInstanceOf(Function);
    });

    it('should be a ActorRuleDereferenceFile constructor', () => {
      expect(new (<any> ActorRuleDereferenceFile)({ name: 'actor', bus })).toBeInstanceOf(ActorRuleDereferenceFile);
      expect(new (<any> ActorRuleDereferenceFile)({ name: 'actor', bus })).toBeInstanceOf(ActorRuleDereference);
    });

    it('should not be able to create new ActorRuleDereferenceFile objects without \'new\'', () => {
      expect(() => { (<any> ActorRuleDereferenceFile)(); }).toThrow();
    });
  });

  describe('An ActorRuleDereferenceFile instance', () => {
    let actor: ActorRuleDereferenceFile;
    let mediatorRuleParse: any;
    let mediaMappings: any;

    beforeEach(() => {
      mediatorRuleParse = {
        async mediate(action: any) {
          const rules = new Readable();
          if (action.context && action.context.has('emitParseError')) {
            rules._read = () => {
              rules.emit('error', new Error('Parse error'));
            };
            return { handle: { rules }};
          } if (action.context && action.context.has('parseReject')) {
            return Promise.reject(new Error('Parse reject error'));
          }
          const data = await arrayifyStream(action.handle.input);
          return {
            handle: {
              rules: { data: data[0], mediaType: action.handleMediaType }
            },
          };
        },
      };
      mediaMappings = { ttl: 'text/turtle', hylar: 'text/hylar', n3: 'text/n3' };
      actor = new ActorRuleDereferenceFile({ name: 'actor', bus, mediaMappings, mediatorRuleParse });
    });

    it('should test', () => {
      return expect(actor.test({ url: fileUrl(path.join(__dirname, 'data/rule.n3')) })).resolves.toEqual(true);
    });

    it('should test non-file URIs', () => {
      return expect(actor.test({ url: path.join(__dirname, 'data/rule.n3') })).resolves.toBeTruthy();
    });

    it('should not test for non-existing files', () => {
      return expect(actor.test({ url: 'fake.ttl' })).rejects.toBeTruthy();
    });

    it('should run', () => {
      const p = path.join(__dirname, 'data/rule.n3');
      const data = fs.readFileSync(p);
      return expect(actor.run({ url: p })).resolves.toMatchObject(
        {
          headers: {},
          rules: {
            data,
            mediaType: 'text/n3',
          },
          exists: true,
          url: p,
        },
      );
    });

    it('should run if a mediatype is provided', () => {
      const p = path.join(__dirname, 'data/rule.n3');
      const data = fs.readFileSync(p);
      return expect(actor.run({ url: p, mediaType: 'text/n3' })).resolves.toMatchObject(
        {
          headers: {},
          rules: {
            data,
            mediaType: 'text/n3',
          },
          url: p,
        },
      );
    });

    it('should run for file:/// paths', () => {
      let p = path.join(__dirname, 'data/rule.n3');
      const data = fs.readFileSync(p);
      p = `file:///${p}`;
      return expect(actor.run({ url: p, mediaType: 'text/n3' })).resolves.toMatchObject(
        {
          headers: {},
          rules: {
            data,
            mediaType: 'text/n3',
          },
          url: p,
        },
      );
    });

    it('should not find a mediatype if an unknown extension is provided', () => {
      const p = path.join(__dirname, 'data/rule.unknown');
      const data = fs.readFileSync(p);
      return expect(actor.run({ url: p })).resolves.toMatchObject(
        {
          headers: {},
          rules: {
            data,
          },
          url: p,
        },
      );
    });

    it('should not find a mediatype if there is no file extension', () => {
      const p = path.join(__dirname, 'data/rule');
      const data = fs.readFileSync(p);
      return expect(actor.run({ url: p })).resolves.toMatchObject(
        {
          headers: {},
          rules: {
            data,
          },
          url: p,
        },
      );
    });

    it('should run and receive parse errors', async() => {
      const p = path.join(__dirname, 'data/rule.n3');
      const context = ActionContext({ emitParseError: true });
      const output = await actor.run({ url: p, context });
      expect(output.url).toEqual(p);
      await expect(arrayifyStream(output.rules)).rejects.toThrow(new Error('Parse error'));
    });

    // it('should run and ignore parse errors in lenient mode', async() => {
    //   const p = path.join(__dirname, 'dummy.ttl');
    //   const context = ActionContext({ emitParseError: true, [KeysInitSparql.lenient]: true });
    //   const spy = jest.spyOn(actor, <any> 'logError');
    //   const output = await actor.run({ url: p, context });
    //   expect(output.url).toEqual(p);
    //   expect(await arrayifyStream(output.rules)).toEqual([]);
    //   expect(spy).toHaveBeenCalledTimes(1);
    // });

    it('should not run on parse rejects', () => {
      const p = path.join(__dirname, 'data/rule.n3');
      const context = ActionContext({ parseReject: true });
      return expect(actor.run({ url: p, context }))
        .rejects.toThrow(new Error('Parse reject error'));
    });

    // it('should run and ignore parse rejects in lenient mode', async() => {
    //   const p = path.join(__dirname, 'dummy.ttl');
    //   const context = ActionContext({ parseReject: true, [KeysInitSparql.lenient]: true });
    //   const spy = jest.spyOn(actor, <any> 'logError');
    //   const output = await actor.run({ url: p, context });
    //   expect(output.url).toEqual(p);
    //   expect(await arrayifyStream(output.quads)).toEqual([]);
    //   expect(spy).toHaveBeenCalledTimes(1);
    // });
  });
});

