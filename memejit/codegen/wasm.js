**`codegen/wasm.js`** - WebAssembly Backend
```javascript
export class WasmCodeGen {
  static generate(ir) {
    return `
      (module
        (func $main (result i32)
          ${this._translateIR(ir)}
        )
        (export "main" (func $main))
      )
    `;
  }

  static _translateIR(ir) {
    return ir.map(op => `(i32.${op.type} ${op.args.join(' ')})`).join('\n');
  }
}
```