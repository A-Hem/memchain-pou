export class CapabilitySecurity {
  static createContext(caps) {
    return {
      read: caps.includes('read'),
      write: caps.includes('write'),
      syscall: this._filterSyscalls(caps)
    };
  }

  static _filterSyscalls(caps) {
    const allowed = [];
    if (caps.includes('net')) allowed.push('fetch');
    if (caps.includes('fs')) allowed.push('readFile');
    return Object.freeze(allowed);
  }
}