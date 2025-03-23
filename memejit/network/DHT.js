```javascript
import { EventEmitter } from 'events';
import kad from 'kad-dht';

export class JITDHT extends EventEmitter {
  constructor(options = {}) {
    super();
    this.dht = new kad({
      transport: new kad.transports.UDP(),
      storage: new kad.storage.MemStore(),
      ...options
    });
  }

  async join(bootstrapNodes = []) {
    return new Promise((resolve) => {
      this.dht.listen(() => {
        bootstrapNodes.forEach(node => this.dht.add(node));
        this.emit('ready');
        resolve();
      });
    });
  }

  async findPeersForHash(hash) {
    return new Promise((resolve) => {
      this.dht.iterativeFindValue(hash, (err, peers) => {
        resolve(peers || []);
      });
    });
  }
}
```
