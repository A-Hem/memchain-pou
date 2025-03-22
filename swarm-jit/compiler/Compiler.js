import { generateWASM } from '@webassemblyjs/wasm-gen';
import { applyOptimizations } from './optimizers.js';

export class Compiler {
  compile(code) {
    const rawWASM = generateWASM(code);
    return applyOptimizations(rawWASM);
  }
}