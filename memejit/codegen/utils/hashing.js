**`codegen/utils/hashing.js`**
```javascript
import { blake3 } from 'blakejs';

export function hashBytecode(code) {
  return blake3(code, { digestLength: 32 });
}

export function quickHash(code) {
  return blake3(code, { digestLength: 8 });
}
```