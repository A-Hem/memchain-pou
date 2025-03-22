// src/utils/hashing.js
import { blake2b } from '@noble/hashes/blake2b';
import { bytesToHex } from '@noble/hashes/utils';

// Main hash function used throughout the system
export function createHash(input, options = {}) {
  const defaults = {
    dkLen: 32, // 32-byte (256-bit) output
    context: 'swarm-jit',
    encode: 'hex'
  };
  
  const opts = { ...defaults, ...options };
  
  // Convert string input to Uint8Array
  const inputBytes = typeof input === 'string' ?
    new TextEncoder().encode(input) :
    input;

  if (!(inputBytes instanceof Uint8Array)) {
    throw new TypeError('Input must be string or Uint8Array');
  }

  const hashBytes = blake2b(inputBytes, {
    dkLen: opts.dkLen,
    context: opts.context
  });

  return opts.encode === 'hex' ? 
    bytesToHex(hashBytes) :
    hashBytes;
}

// Fast 64-bit hash for non-cryptographic use
export function quickHash(input) {
  return bytesToHex(
    blake2b(input, { dkLen: 8 }) // 64-bit
  ).slice(0, 16); // First 16 hex chars (64 bits)
}