import HyperDHT from 'hyperdht';
import { generateSwarmKey } from './keygen.js';

export class SwarmNetwork {
  constructor() {
    this.keyPair = this._getKeyPair();
    this.dht = new HyperDHT();
    this.node = this.dht.createNode(this.keyPair);
  }

  _getKeyPair() {
    if (process.env.SWARM_KEY === 'auto') {
      return generateSwarmKey(); // Ephemeral key
    }
    
    if (process.env.SWARM_KEY === 'persistent') {
      return generateSwarmKey(); // Auto-saved to .swarmkey
    }
    
    // Use existing key from env
    return crypto.createPrivateKey(process.env.SWARM_KEY);
  }
}
