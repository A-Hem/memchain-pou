# 1. WASM Compiler (lib/compiler.js)
```javascript
const { compile } = require('@webassemblyjs/wasm-gen');
const { optimize } = require('@webassemblyjs/wasm-opt');

export class JITCompiler {
  constructor() {
    this.cache = new Map();
  }

  async compile(source) {
    const hash = this._createHash(source);
    
    if (this.cache.has(hash)) {
      return this.cache.get(hash);
    }

    const wasm = await this._compile(source);
    const optimized = optimize(wasm, {
      shrinkLevel: 2,
      optimizeLevel: 3
    });

    this.cache.set(hash, optimized);
    return optimized;
  }

  _createHash(input) {
    return crypto.createHash('blake2b')
      .update(input)
      .digest('hex');
  }
}
```