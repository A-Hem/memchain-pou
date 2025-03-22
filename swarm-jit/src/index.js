// src/index.js - Main export hub

// Compiler System
export { Compiler } from './compiler/Compiler.js';
export { optimize, darwinOptimize } from './compiler/optimizers.js';

// Runtime System
export { WASM } from './runtime/wasm.js';
export { Memory } from './runtime/memory.js';

// Swarm Network
export { SwarmNetwork } from './swarm/DHT.js';
export { KeyManager } from './swarm/keygen.js';
export { startNode } from './swarm/node.js';

// Utilities
export { createHash, quickHash } from './utils/hashing.js';