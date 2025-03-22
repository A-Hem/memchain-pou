// src/runtime/wasm.js
import { WasmRunner } from '@wasmer/wasi';
import { blake2b } from '@noble/hashes/blake2b';
import { Memory } from './memory.js';

export class WASM {
  constructor() {
    this.runner = new WasmRunner({
      instantiate: (imports) => this._sanitizeImports(imports)
    });
    this.cache = new Map();
    this.memory = new Memory(1024); // 1GB initial limit
  }

  async execute(wasmBuffer, input, opts = {}) {
    const moduleId = this._createHash(wasmBuffer);
    let memoryInstance;

    try {
      memoryInstance = this.memory.allocate(moduleId);
      const instance = await this.runner.instantiate(wasmBuffer, { 
        env: { memory: memoryInstance } 
      });
      
      this._validateExports(instance.exports);
      
      const result = await this._runSafe(() => {
        if(opts.entryPoint) {
          return instance.exports[opts.entryPoint](input);
        }
        return instance.exports.main(input);
      });

      return result;
    } catch (error) {
      throw new WASMRuntimeError(error.message);
    } finally {
      if(memoryInstance) {
        this.memory.free(moduleId);
      }
    }
  }

  // Rest of the methods remain the same...
}

class WASMRuntimeError extends Error {
  constructor(message) {
    super(`WASM Runtime Error: ${message}`);
    this.name = "WASMRuntimeError";
  }
}