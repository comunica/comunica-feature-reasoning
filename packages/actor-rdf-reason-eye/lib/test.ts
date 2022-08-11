import { EYE_PL } from './eye-pl';

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
  await (Module as any).FS.writeFile('eye.pl', EYE_PL)
  return Module;
}

(async () => {
  const module = await getModule();
  console.log(module);
})();



// console.log(require('./swipl-web.js'))