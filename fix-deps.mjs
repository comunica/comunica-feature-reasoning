#!/usr/bin/env ./node_modules/zx/zx.mjs

import depcheck from 'depcheck';
import { fs } from 'zx';
import { os } from 'zx';

const options = {
  ignoreBinPackage: false, // ignore the packages with bin entry
  skipMissing: false, // skip calculation of missing dependencies
  ignorePatterns: [
    // files matching these patterns will be ignored
    'sandbox',
    'dist',
    'bower_components',
  ],
  ignoreMatches: [
    // ignore dependencies that matches these globs
    'grunt-*',
  ],
  parsers: {
    // the target parsers
    '**/*.js': depcheck.parser.es6,
    // '**/*.ts': depcheck.parser.jsx,
  },
  detectors: [
    // the target detectors
    depcheck.detector.requireCallExpression,
    depcheck.detector.importDeclaration,
  ],
  specials: [],
  package: {},
};

for (const pkg of fs.readdirSync('./packages')) {
  const result = await depcheck(`./packages/${pkg}`, options);
  await $`lerna exec --scope=@comunica/${pkg} -- yarn add ${Object.keys(result.missing).join(' ')}`
}

// const packages = fs.readdirSync('./packages');


// console.log(packages)



// depcheck('/path/to/your/project', options).then((unused) => {
//   console.log(unused.dependencies); // an array containing the unused dependencies
//   console.log(unused.devDependencies); // an array containing the unused devDependencies
//   console.log(unused.missing); // a lookup containing the dependencies missing in `package.json` and where they are used
//   console.log(unused.using); // a lookup indicating each dependency is used by which files
//   console.log(unused.invalidFiles); // files that cannot access or parse
//   console.log(unused.invalidDirs); // directories that cannot access
// });
