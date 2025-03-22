import { WasmRunner } from 'wasmer-js';

export class WASM {
  constructor() {
    this.runner = new WasmRunner();
    this.cache = new Map();
  }

  async execute(wasmBuffer, input) {
    const instance = await this.runner.instantiate(wasmBuffer);
    return instance.exports.main(input);
  }

  precompile(wasmBuffer) {
    const hash = this._createHash(wasmBuffer);
    this.cache.set(hash, wasmBuffer);
    return hash;
  }

  _createHash(buffer) {
    return crypto.createHash('blake2b')
      .update(buffer)
      .digest('hex');
  }
}