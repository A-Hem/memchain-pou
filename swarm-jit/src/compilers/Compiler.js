
// src/compiler/Compiler.js
import { generate } from '@webassemblyjs/wasm-gen';
import { optimize, darwinOptimize } from './optimizers.js';

export class Compiler {
  compile(code, { optimizationLevel = 1 } = {}) {
    try {
      // 1. Generate initial WASM
      const rawWASM = generate(code);
      
      // 2. Apply optimizations based on level
      switch(optimizationLevel) {
        case 2:
          return darwinOptimize(rawWASM);
        case 1: 
        default:
          return optimize(rawWASM);
      }
    } catch (error) {
      throw new CompileError(`Failed to compile: ${error.message}`);
    }
  }
}

class CompileError extends Error {
  constructor(message) {
    super(message);
    this.name = "CompileError";
  }
}


