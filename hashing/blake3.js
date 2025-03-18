
#### Hashing Utilities (src/hashing/blake3.js)**

  
```javascript
import { blake3 } from '@noble/hashes/blake3'

export function memHash(data) {
  return blake3(data, { dkLen: 32, key: 'MemChain_v1' })
}

// Derived from @paulmillr's noble-hashes
```
