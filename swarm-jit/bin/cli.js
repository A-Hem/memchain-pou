#!/usr/bin/env node
import { Compiler } from '../src/compiler/Compiler.js';
import { SwarmNetwork } from '../src/swarm/DHT.js';
import { program } from 'commander';

program
  .command('compile <file>')
  .action(async (file) => {
    const compiler = new Compiler();
    const swarm = new SwarmNetwork();
    const wasm = compiler.compile(await fs.readFile(file));
    const key = await swarm.publish(wasm);
    console.log(`Published: ${key}`);
  });

program.parse();