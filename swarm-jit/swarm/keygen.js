import crypto from 'crypto';
import { writeFileSync } from 'fs';

export function generateSwarmKey() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const keyPair = { publicKey, privateKey };
  
  if (process.env.SWARM_KEY === 'persistent') {
    writeFileSync('.swarmkey', privateKey.export({ type: 'pkcs8', format: 'pem' }));
  }
  
  return keyPair;
}