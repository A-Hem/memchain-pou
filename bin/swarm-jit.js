#!/usr/bin/env node
import { JITCompiler } from '../lib/compiler';
import { JITSwarm } from '../lib/swarm';

const compiler = new JITCompiler();
const swarm = new JITSwarm();

require('yargs')
  .command('compile <file>', 'Compile to WASM', {}, async (argv) => {
    const code = await fs.promises.readFile(argv.file);
    const wasm = await compiler.compile(code);
    await swarm.share(wasm);
    console.log(`Compiled ${argv.file} ➔ ${wasm.byteLength} bytes`);
  })
  .command('run <hash>', 'Execute WASM', {}, async (argv) => {
    const wasm = await swarm.find(argv.hash);
    const instance = await WebAssembly.instantiate(wasm);
    console.log(instance.exports.main());
  })
  .argv;
