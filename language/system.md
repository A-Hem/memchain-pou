
/**
 * Worker Language System
 * 
 * This module defines the supported languages for worker execution and
 * provides the necessary tools to execute code in each language.
 */

const { NodeVM } = require('vm2');
const ts = require('typescript');
const fetch = require('node-fetch');

/**
 * Language definitions with execution engines
 */
class LanguageSystem {
  constructor() {
    // Register supported languages
    this.supportedLanguages = {
      'javascript': {
        name: 'JavaScript',
        extension: 'js',
        execute: this.executeJavaScript.bind(this),
        validateCode: this.validateJavaScript.bind(this),
        supportedVersions: ['ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020']
      },
      'typescript': {
        name: 'TypeScript',
        extension: 'ts',
        execute: this.executeTypeScript.bind(this),
        validateCode: this.validateTypeScript.bind(this),
        supportedVersions: ['3.9', '4.0', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7']
      }
      // Can be extended for other languages like Python, Rust, etc.
    };
    
    // Default execution options
    this.defaultOptions = {
      timeout: 5000, // 5 seconds execution timeout
      memoryLimit: 128, // 128MB memory limit
      allowedModules: ['lodash', 'moment', 'axios'] // Allowed npm modules
    };
  }
  
  /**
   * Check if a language is supported
   * @param {string} language - Language identifier
   * @returns {boolean} - Whether the language is supported
   */
  isLanguageSupported(language) {
    return Object.keys(this.supportedLanguages).includes(language.toLowerCase());
  }
  
  /**
   * Get language details
   * @param {string} language - Language identifier
   * @returns {Object} - Language details
   */
  getLanguageDetails(language) {
    if (!this.isLanguageSupported(language)) {
      throw new Error(`Language '${language}' is not supported`);
    }
    return this.supportedLanguages[language.toLowerCase()];
  }
  
  /**
   * Execute JavaScript code
   * @param {string} code - JavaScript code to execute
   * @param {Object} input - Input data for the code
   * @param {Object} options - Execution options
   * @returns {Object} - Execution result
   */
  async executeJavaScript(code, input, options = {}) {
    const executionOptions = { ...this.defaultOptions, ...options };
    
    try {
      // Create a VM sandbox
      const vm = new NodeVM({
        console: 'redirect',
        sandbox: { input },
        require: {
          external: true,
          builtin: ['fs', 'path', 'crypto'],
          root: './',
          mock: {
            fs: {
              readFileSync: () => { throw new Error('File system access not allowed'); }
            }
          },
          context: 'sandbox',
          import: executionOptions.allowedModules
        },
        timeout: executionOptions.timeout,
        strict: true
      });
      
      // Capture console output
      let consoleOutput = [];
      vm.on('console.log', (...args) => {
        consoleOutput.push(args.map(arg => String(arg)).join(' '));
      });
      vm.on('console.error', (...args) => {
        consoleOutput.push(`ERROR: ${args.map(arg => String(arg)).join(' ')}`);
      });
      vm.on('console.warn', (...args) => {
        consoleOutput.push(`WARNING: ${args.map(arg => String(arg)).join(' ')}`);
      });
      
      // Execute the code
      const script = vm.run(`
        module.exports = async function(input) {
          ${code}
        };
      `, 'worker.js');
      
      // Run the exported function
      const result = await script(input);
      
      return {
        success: true,
        result,
        console: consoleOutput,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        console: consoleOutput,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Execute TypeScript code
   * @param {string} code - TypeScript code to execute
   * @param {Object} input - Input data for the code
   * @param {Object} options - Execution options
   * @returns {Object} - Execution result
   */
  async executeTypeScript(code, input, options = {}) {
    const executionOptions = { ...this.defaultOptions, ...options };
    
    try {
      // Compile TypeScript to JavaScript
      const transpileOptions = {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        }
      };
      
      const result = ts.transpileModule(code, transpileOptions);
      
      if (result.diagnostics && result.diagnostics.length > 0) {
        return {
          success: false,
          error: 'TypeScript compilation error',
          diagnostics: result.diagnostics,
          executionTime: 0
        };
      }
      
      // Execute the compiled JavaScript
      return await this.executeJavaScript(result.outputText, input, options);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        executionTime: 0
      };
    }
  }
  
  /**
   * Validate JavaScript code
   * @param {string} code - JavaScript code to validate
   * @returns {Object} - Validation result
   */
  validateJavaScript(code) {
    try {
      // Try to parse the code using JavaScript parser
      Function(`"use strict"; ${code}`);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        line: error.lineNumber,
        column: error.columnNumber
      };
    }
  }
  
  /**
   * Validate TypeScript code
   * @param {string} code - TypeScript code to validate
   * @returns {Object} - Validation result
   */
  validateTypeScript(code) {
    try {
      // Create a TypeScript program and check for errors
      const fileName = 'worker.ts';
      const compilerOptions = {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        strict: true,
      };
      
      // Create the TypeScript program
      const host = ts.createCompilerHost(compilerOptions);
      host.getSourceFile = (name) => {
        return name === fileName 
          ? ts.createSourceFile(fileName, code, ts.ScriptTarget.ES2020)
          : undefined;
      };
      
      const program = ts.createProgram([fileName], compilerOptions, host);
      const diagnostics = ts.getPreEmitDiagnostics(program);
      
      if (diagnostics.length > 0) {
        return {
          valid: false,
          errors: diagnostics.map(diagnostic => {
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            return {
              message,
              line: position.line + 1,
              column: position.character + 1
            };
          })
        };
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}
