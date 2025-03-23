`network/NAT.js`
```javascript
export class NATTraversal {
  constructor(dht) {
    this.dht = dht;
    this.relays = new Map();
  }

  async punchHole(targetPeer) {
    try {
      // Direct connection attempt
      return await this._connectDirect(targetPeer);
    } catch {
      // Fallback to relay
      return this._connectViaRelay(targetPeer);
    }
  }

  async _connectDirect(peer) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(peer.endpoint);
      socket.onopen = () => resolve(socket);
      socket.onerror = () => reject();
    });
  }
}
```