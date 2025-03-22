import { optimize, darwinOptimize } from './optimizers.js';
import { generate } from '@webassemblyjs/wasm-gen';

export class Compiler {
  compile(source, { aggressive=false }={}) {
    const rawWASM = generate(source);
    return aggressive ? 
      darwinOptimize(rawWASM) :
      optimize(rawWASM);
  }
}