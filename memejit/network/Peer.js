
###  `network/Peer.js`
```javascript
import { JITProtocol } from './Protocol.js';

export class Peer {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.socket = null;
    this.capabilities = {};
  }

  async connect() {
    this.socket = new WebSocket(this.endpoint);
    this.socket.binaryType = 'arraybuffer';
    
    return new Promise((resolve) => {
      this.socket.addEventListener('open', () => {
        this._exchangeCapabilities();
        resolve();
      });
    });
  }

  send(message) {
    this.socket.send(JITProtocol.encode(message));
  }
}
```