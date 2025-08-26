// server.js - Custom server with polyfills
// Load polyfills IMMEDIATELY before anything else
if (typeof global !== 'undefined') {
  // Ensure File constructor exists IMMEDIATELY
  if (typeof global.File === 'undefined') {
    // Create minimal Blob first
    if (typeof global.Blob === 'undefined') {
      global.Blob = class Blob {
        constructor(parts = [], options = {}) {
          this.size = 0;
          this.type = options.type || '';
        }
        size = 0;
        type = '';
        async text() { return ''; }
        async arrayBuffer() { return new ArrayBuffer(0); }
        stream() { return {}; }
        slice() { return new global.Blob(); }
      };
    }

    // Create File constructor immediately
    global.File = class File extends global.Blob {
      constructor(fileBits, fileName, options = {}) {
        super(fileBits, options);
        this.name = fileName;
        this.lastModified = options.lastModified || Date.now();
        this.webkitRelativePath = '';
      }
      name = '';
      lastModified = Date.now();
      webkitRelativePath = '';
    };

    console.log('[Immediate Polyfill] File constructor applied');
  }

  // Ensure FormData exists
  if (typeof global.FormData === 'undefined') {
    global.FormData = class FormData {
      constructor() { this.data = new Map(); }
      data = new Map();
      append(name, value) { this.data.set(name, value); }
      get(name) { return this.data.get(name); }
      has(name) { return this.data.has(name); }
      set(name, value) { this.data.set(name, value); }
      delete(name) { this.data.delete(name); }
      entries() { return this.data.entries(); }
      keys() { return this.data.keys(); }
      values() { return this.data.values(); }
      [Symbol.iterator]() { return this.data.entries(); }
    };
  }
}

// Also load the full polyfill file
require('./lib/global-polyfills');

// Now start the Next.js server
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Polyfills loaded: File=${typeof global.File !== 'undefined'}, FormData=${typeof global.FormData !== 'undefined'}`);

    // THIS IS THE CRUCIAL LINE THAT WAS ADDED
    // It signals to PM2 that the application has started and is ready.
    if (process.send) {
      process.send('ready');
    }
  });
}).catch((ex) => {
  console.error('Error starting server:', ex);
  process.exit(1);
});
