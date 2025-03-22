// Responsible for:
// - Generating ED25519 key pairs
// - Persistent key storage
// - Key rotation

import crypto from 'crypto';
import { writeFileSync, readFileSync } from 'fs';

export class KeyManager {
  static generate() {
    return crypto.generateKeyPairSync('ed25519');
  }
  
  static saveToFile(keyPair, path) {
    writeFileSync(path, keyPair.privateKey.export({ type: 'pkcs8' }));
  }
  
  static loadFromFile(path) {
    return crypto.createPrivateKey(readFileSync(path));
  }
}