import { inspect } from 'util';

export class ExecutionLogger {
  static log(jobId, message, severity = 'info') {
    const entry = {
      timestamp: Date.now(),
      job: jobId,
      severity,
      message: this._sanitize(message),
      context: this._captureContext()
    };
    
    process.send?.(entry); // IPC if child process
    console.log(JSON.stringify(entry));
  }

  static _sanitize(input) {
    return inspect(input, {
      showHidden: false,
      depth: 1, // Prevent logging sensitive deep objects
      breakLength: Infinity
    });
  }

  static _captureContext() {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      stack: new Error().stack.split('\n').slice(2) // Call site
    };
  }
}