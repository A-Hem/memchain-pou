**`codegen/utils/registers.js`**
```javascript
export const instructionSet = {
  add: (dst, src) => `add ${dst}, ${src}`,
  move: (from, to) => `mov ${to}, ${from}`,
  // ...
};

export const neon = {
  process: (op) => {
    return [`vadd.${op.type} ${op.dest}, ${op.src1}, ${op.src2}`];
  }
};
```