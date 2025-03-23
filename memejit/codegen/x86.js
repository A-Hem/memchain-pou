**`codegen/x86.js`** - Intel/AMD Targets
```javascript
import { instructionSet } from './utils/registers.js';
import { hashBytecode } from './utils/hashing.js';

export class X86CodeGen {
  constructor(optimize = true) {
    this.registers = new Map();
    this.optimize = optimize;
  }

  generate(ir) {
    const asm = this._selectInstructions(ir);
    return this.optimize ? this._optimize(asm) : asm;
  }

  _selectInstructions(ir) {
    return ir.map(op => {
      switch(op.type) {
        case 'ADD':
          return instructionSet.add(op.args);
        case 'MOV':
          return instructionSet.move(op.from, op.to);
        // ... other IR operations
      }
    });
  }
}
```