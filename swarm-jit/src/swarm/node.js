// src/swarm/node.js
import { KeyManager } from './keygen.js';
import { SwarmNetwork } from './DHT.js';
import { WASM } from '../runtime/wasm.js';
import { logger } from '../utils/logger.js';

export async function startNode(options = {}) {
  const defaults = {
    port: 3282,
    memoryLimit: 1024, // MB
    enableCompiler: true,
    persistKeys: true
  };
  const opts = { ...defaults, ...options };

  // Initialize core components
  const keyPair = opts.keyPair || await KeyManager.loadOrGenerate(opts.persistKeys);
  const swarm = new SwarmNetwork(keyPair);
  const wasmRuntime = new WASM({ memoryLimit: opts.memoryLimit });

  // Start swarm services
  await swarm.listen(opts.port);
  logger.info(`Node started on port ${opts.port} - ID: ${swarm.nodeId}`);

  // Enable JIT compiler service
  if (opts.enableCompiler) {
    swarm.handle('compile', async ({ code, lang }) => {
      try {
        const wasm = await compileRequest(code, lang);
        const hash = wasmRuntime.precompile(wasm);
        return { hash, size: wasm.byteLength };
      } catch (error) {
        logger.error(`Compilation failed: ${error.message}`);
        throw new Error('COMPILE_ERROR');
      }
    });
  }

  // Enable WASM execution service
  swarm.handle('execute', async ({ hash, input }) => {
    const wasm = await swarm.fetch(hash);
    return wasmRuntime.execute(wasm, input, {
      timeout: 5000 // 5 seconds
    });
  });

  return {
    swarm,
    stop: async () => {
      await swarm.close();
      logger.info('Node stopped');
    }
  };
}

async function compileRequest(code, lang = 'js') {
  // Security checks
  if (code.length > 1024 * 1024) throw new Error('Code too large');
  if (!['js', 'rust', 'wat'].includes(lang)) throw new Error('Unsupported language');
  
  return new Compiler().compile(code, { 
    optimizationLevel: 2 // Aggressive Darwinian optimizations
  });
}