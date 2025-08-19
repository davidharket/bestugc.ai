// lib/global-polyfills.js
// Global polyfills for Node.js environment compatibility
// This file must be loaded before any modules that depend on browser APIs

if (typeof global !== 'undefined' && typeof global.File === 'undefined') {
  // Polyfill Blob first
  if (typeof global.Blob === 'undefined') {
    global.Blob = class Blob {
      constructor(parts = [], options = {}) {
        this.size = 0;
        this.type = options.type || '';
        // Calculate size
        if (parts) {
          for (const part of parts) {
            if (typeof part === 'string') {
              this.size += Buffer.byteLength(part, 'utf8');
            } else if (part instanceof Buffer) {
              this.size += part.length;
            } else if (part instanceof ArrayBuffer) {
              this.size += part.byteLength;
            }
          }
        }
      }

      async text() {
        return '';
      }

      async arrayBuffer() {
        return new ArrayBuffer(0);
      }

      stream() {
        const { Readable } = require('stream');
        return new Readable({
          read() {
            this.push(null);
          }
        });
      }

      slice(start, end, contentType) {
        return new global.Blob([], { type: contentType });
      }
    };
  }

  // Polyfill File constructor
  global.File = class File extends global.Blob {
    constructor(fileBits, fileName, options = {}) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options.lastModified || Date.now();
      this.webkitRelativePath = '';
    }
  };

  console.log('[Global Polyfill] File constructor applied');
}

// Polyfill FormData
if (typeof global !== 'undefined' && typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map();
    }

    append(name, value, filename) {
      this.data.set(name, value);
    }

    delete(name) {
      this.data.delete(name);
    }

    get(name) {
      return this.data.get(name);
    }

    getAll(name) {
      const value = this.data.get(name);
      return value ? [value] : [];
    }

    has(name) {
      return this.data.has(name);
    }

    set(name, value, filename) {
      this.data.set(name, value);
    }

    entries() {
      return this.data.entries();
    }

    keys() {
      return this.data.keys();
    }

    values() {
      return this.data.values();
    }

    [Symbol.iterator]() {
      return this.data.entries();
    }
  };

  console.log('[Global Polyfill] FormData applied');
}