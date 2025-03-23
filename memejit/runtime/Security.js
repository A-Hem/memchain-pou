import { ExecutionLogger } from './utils/logger.js';

export class CapabilitySecurity {
  static createContext(caps) {
    return {
      read: caps.includes('read'),
      write: caps.includes('write'),
      syscall: this._filterSyscalls(caps),
      allowTimers: caps.includes('timers'),
      allowHeavyMath: caps.includes('heavyMath'),
      memoryPages: caps.memoryPages || 10
    };
  }

  static _filterSyscalls(caps) {
    const allowed = [];
    if (caps.includes('net')) allowed.push('fetch');
    if (caps.includes('fs')) allowed.push('readFile');
    return Object.freeze(allowed);
  }

  static _getSafeImports(context) {
    return {
      // Allow math but limit precision
      Math: this._wrapMath(context),

      // Controlled Date access
      Date: context.allowTimers ? Date : () => Date.now(),

      // Memory access guard
      memory: new WebAssembly.Memory({
        initial: context.memoryPages || 10
      })
    };
  }

  static _wrapMath(context) {
    const safeMath = Object.create(Math);

    // Prevent timing attacks
    safeMath.random = () => {
      ExecutionLogger.log('Security', 'Math.random() called');
      return crypto.randomBytes(4).readUInt32LE() / 0xFFFFFFFF;
    };

    // Limit heavy operations
    if (!context.allowHeavyMath) {
      safeMath.pow = (base, exp) => {
        if (exp > 100) throw new Error('Exponent too large');
        return Math.pow(base, exp);
      };
    }

    return Object.freeze(safeMath);
  }
}